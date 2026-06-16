#!/usr/bin/env python3
"""
Colab Notebook: Fine-tune Spoiler Detection Model for Shelf to Tales

This notebook trains a per-book spoiler detection model using unsloth.
It watches a Google Drive folder for new training data and auto-trains.

Setup:
1. Upload this notebook to Google Colab
2. Mount Google Drive
3. Set DRIVE_FOLDER to your training data folder
4. Enable webhook notifications to your backend
"""
import os
import json
import time
import requests
from pathlib import Path

# ============ CONFIGURATION ============
DRIVE_FOLDER = "shelftotales-training"  # Google Drive folder name
BASE_MODEL = "unsloth/llama-3-8b-Instruct"
WEBHOOK_URL = ""  # Your backend webhook URL (e.g., https://your-app.com/api/ai/webhooks/training-complete)
POLL_INTERVAL = 300  # Check for new training data every 5 minutes
# =======================================

def mount_drive():
    """Mount Google Drive."""
    from google.colab import drive
    drive.mount('/content/drive')
    print(f"Drive mounted. Training data folder: /content/drive/MyDrive/{DRIVE_FOLDER}")

def check_for_new_training_data():
    """Check Drive folder for new training JSONL files."""
    training_dir = Path(f"/content/drive/MyDrive/{DRIVE_FOLDER}")
    if not training_dir.exists():
        training_dir.mkdir(parents=True)
        return []

    # Look for files matching spoiler-train-{bookId}.jsonl
    jsonl_files = list(training_dir.glob("spoiler-train-*.jsonl"))
    trained_marker = training_dir / ".trained"

    # Load list of already-trained books
    trained_books = set()
    if trained_marker.exists():
        with open(trained_marker) as f:
            trained_books = set(f.read().splitlines())

    # Filter to untrained books
    new_files = []
    for f in jsonl_files:
        book_id = f.stem.replace("spoiler-train-", "")
        if book_id not in trained_books:
            new_files.append((book_id, f))

    return new_files

def train_model(book_id, training_data_path):
    """Train a model for a specific book using unsloth."""
    print(f"\n{'='*60}")
    print(f"Training model for book ID: {book_id}")
    print(f"Training data: {training_data_path}")
    print(f"{'='*60}\n")

    # Install dependencies
    !pip install unsloth
    !pip install --upgrade transformers datasets trl

    from unsloth import FastLanguageModel
    from trl import SFTTrainer
    from transformers import TrainingArguments
    from datasets import load_dataset

    # Load base model
    print("Loading base model...")
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name=BASE_MODEL,
        max_seq_length=2048,
        dtype=None,
        load_in_4bit=True,
    )

    # Add LoRA adapters
    print("Adding LoRA adapters...")
    model = FastLanguageModel.get_peft_model(
        model,
        r=16,
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                        "gate_proj", "up_proj", "down_proj"],
        lora_alpha=16,
        lora_dropout=0,
        bias="none",
        use_gradient_checkpointing="unsloth",
    )

    # Load training data
    print("Loading training data...")
    dataset = load_dataset('json', data_files=str(training_data_path), split='train')
    print(f"Loaded {len(dataset)} training examples")

    # Training config
    training_args = TrainingArguments(
        output_dir=f"./results/book-{book_id}",
        num_train_epochs=3,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=4,
        learning_rate=2e-4,
        fp16=True,
        logging_steps=10,
        save_strategy="epoch",
        optim="adamw_8bit",
    )

    trainer = SFTTrainer(
        model=model,
        tokenizer=tokenizer,
        train_dataset=dataset,
        dataset_text_field="messages",
        max_seq_length=2048,
        args=training_args,
    )

    # Train
    print("Starting training...")
    trainer.train()

    # Save LoRA adapter
    lora_path = f"./models/spoiler-{book_id}-lora"
    model.save_pretrained(lora_path)
    print(f"LoRA adapter saved to: {lora_path}")

    # Export to GGUF
    print("Exporting to GGUF (q4_k_m)...")
    gguf_path = f"./models/spoiler-{book_id}-gguf"
    model.save_pretrained_gguf(gguf_path, tokenizer, quantization_method="q4_k_m")
    print(f"GGUF model saved to: {gguf_path}/")

    return gguf_path

def create_ollama_model(book_id, gguf_path):
    """Create Ollama model from GGUF file."""
    model_name = f"shelf-spoiler-book-{book_id}"
    gguf_file = list(Path(gguf_path).glob("*.gguf"))[0]

    modelfile_content = f"""FROM {gguf_file}

TEMPLATE \"\"\"<|begin_of_text|><|start_header_id|>system<|end_header_id|>
You are a spoiler detection model. Classify book reviews as:
- SAFE: No spoilers
- MINOR_SPOILER: Hints about plot or characters
- MAJOR_SPOILER: Reveals key plot points, endings, or character deaths

You MUST respond with ONLY valid JSON:
{{
  "level": "SAFE" | "MINOR_SPOILER" | "MAJOR_SPOILER",
  "score": 0.0-1.0,
  "reasoning": "brief explanation"
}}<|eot_id|><|start_header_id|>user<|end_header_id|>
Analyze this review for spoilers:
{{{{ .Prompt }}}}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
\"\"\"

PARAMETER temperature 0.1
PARAMETER num_predict 200
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
"""

    modelfile_path = Path(gguf_path) / "Modelfile"
    with open(modelfile_path, 'w') as f:
        f.write(modelfile_content)

    print(f"Created Modelfile for {model_name}")
    print(f"To create the Ollama model, run locally:")
    print(f"  ollama create {model_name} -f {modelfile_path}")

    return model_name, modelfile_path

def notify_backend(book_id, model_name, status, gguf_drive_file_id=None):
    """Send webhook notification to backend."""
    if not WEBHOOK_URL:
        print("No webhook URL configured. Manual notification required.")
        return

    payload = {
        "bookId": int(book_id),
        "modelName": model_name,
        "status": status,
    }
    if gguf_drive_file_id:
        payload["ggufDriveFileId"] = gguf_drive_file_id

    try:
        response = requests.post(WEBHOOK_URL, json=payload, timeout=10)
        print(f"Backend notified: {response.status_code}")
    except Exception as e:
        print(f"Failed to notify backend: {e}")

def upload_to_drive(local_path, drive_path):
    """Upload a file to Google Drive."""
    from google.colab import files
    import shutil

    src = Path(local_path)
    dst = Path(f"/content/drive/MyDrive/{DRIVE_FOLDER}") / drive_path
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    print(f"Uploaded {src} to {dst}")
    return str(dst)

def mark_as_trained(book_id):
    """Mark a book as trained to avoid re-training."""
    training_dir = Path(f"/content/drive/MyDrive/{DRIVE_FOLDER}")
    trained_marker = training_dir / ".trained"

    with open(trained_marker, 'a') as f:
        f.write(f"{book_id}\n")

def main_training_loop():
    """Main loop: poll for new training data and train models."""
    mount_drive()

    print(f"Starting training loop. Checking every {POLL_INTERVAL} seconds...")
    print(f"Press Ctrl+C to stop.\n")

    while True:
        new_books = check_for_new_training_data()

        if new_books:
            print(f"Found {len(new_books)} new book(s) to train:")
            for book_id, path in new_books:
                print(f"  - Book {book_id}: {path}")

            for book_id, training_path in new_books:
                try:
                    # Train the model
                    gguf_path = train_model(book_id, training_path)

                    # Create Ollama model files
                    model_name, modelfile_path = create_ollama_model(book_id, gguf_path)

                    # Upload GGUF to Drive
                    gguf_file = list(Path(gguf_path).glob("*.gguf"))[0]
                    drive_gguf_path = upload_to_drive(gguf_file, f"models/{book_id}/{gguf_file.name}")

                    # Upload Modelfile to Drive
                    upload_to_drive(modelfile_path, f"models/{book_id}/Modelfile")

                    # Notify backend
                    notify_backend(book_id, model_name, "COMPLETE")

                    # Mark as trained
                    mark_as_trained(book_id)

                    print(f"\n✓ Training complete for book {book_id}")
                    print(f"  Model: {model_name}")
                    print(f"  GGUF: {drive_gguf_path}")

                except Exception as e:
                    print(f"\n✗ Training failed for book {book_id}: {e}")
                    notify_backend(book_id, f"shelf-spoiler-book-{book_id}", "FAILED")
        else:
            print(f"No new training data. Checking again in {POLL_INTERVAL}s...")

        time.sleep(POLL_INTERVAL)

# Run the main loop when notebook executes
if __name__ == "__main__":
    main_training_loop()
