#!/usr/bin/env python3
"""
Fine-tune DistilBERT for spoiler detection and export to ONNX.

Reads conversational JSONL training data, extracts (review_text, label) pairs,
fine-tunes DistilBERT for 3-class classification (SAFE/MINOR/MAJOR),
evaluates, and exports the model to ONNX format.

Usage:
    python3 scripts/train-spoiler-detector.py [--epochs 10] [--lr 2e-5] [--batch-size 16]
"""

import argparse
import json
import os
import sys
import re
import random
from pathlib import Path
from typing import List, Tuple, Dict

import numpy as np
import torch
from torch.utils.data import Dataset, DataLoader
from torch.optim import AdamW
from transformers import (
    DistilBertTokenizer,
    DistilBertForSequenceClassification,
    get_linear_schedule_with_warmup,
)

LABEL_MAP = {"SAFE": 0, "MINOR_SPOILER": 1, "MAJOR_SPOILER": 2}
ID_TO_LABEL = {v: k for k, v in LABEL_MAP.items()}

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
TRAINING_DATA_DIR = BACKEND_DIR / "training-data"
GENERAL_DATA = BACKEND_DIR / "spoiler-train.jsonl"
MODEL_OUTPUT_DIR = BACKEND_DIR / "target" / "transformer-model"
ONNX_OUTPUT_DIR = BACKEND_DIR / "src" / "main" / "resources" / "models"


def load_conversational_jsonl(filepath: Path) -> List[Tuple[str, int]]:
    """Parse conversational JSONL (messages format) into (text, label) pairs.
    Handles both:
      - Standard JSONL: one compact JSON object per line
      - Pretty-printed JSON array: [ {..}, {..} ] spread across lines
    """
    samples = []
    if not filepath.exists():
        return samples

    content = filepath.read_text(encoding="utf-8").strip()
    if not content:
        return samples

    # Try parsing as a JSON array first (pretty-printed format)
    try:
        data = json.loads(content)
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict):
                    user_text, assistant_text = _extract_messages(item)
                    if user_text and assistant_text:
                        label = extract_label(assistant_text)
                        if label is not None:
                            samples.append((user_text.strip(), label))
            return samples
    except json.JSONDecodeError:
        pass

    # Fall back to line-by-line JSONL parsing
    for line_num, line in enumerate(content.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            data = json.loads(line)
            if isinstance(data, dict):
                user_text, assistant_text = _extract_messages(data)
                if user_text and assistant_text:
                    label = extract_label(assistant_text)
                    if label is not None:
                        samples.append((user_text.strip(), label))
        except json.JSONDecodeError as e:
            print(f"  Warning: skipping line {line_num} in {filepath.name}: {e}")

    return samples


def _extract_messages(data: dict):
    """Extract user and assistant text from a messages dict."""
    messages = data.get("messages", [])
    user_text = None
    assistant_text = None
    for msg in messages:
        if msg.get("role") == "user":
            user_text = msg.get("content", "")
        elif msg.get("role") == "assistant":
            assistant_text = msg.get("content", "")
    return user_text, assistant_text


def extract_label(assistant_text: str) -> int:
    """Extract label from assistant response (JSON or text)."""
    try:
        parsed = json.loads(assistant_text)
        level = parsed.get("level", "").upper()
        return LABEL_MAP.get(level)
    except json.JSONDecodeError:
        pass

    text = assistant_text.upper()
    if "MAJOR_SPOILER" in text:
        return LABEL_MAP["MAJOR_SPOILER"]
    elif "MINOR_SPOILER" in text:
        return LABEL_MAP["MINOR_SPOILER"]
    elif "SAFE" in text:
        return LABEL_MAP["SAFE"]
    return None


def augment_data(samples: List[Tuple[str, int]]) -> List[Tuple[str, int]]:
    """Apply augmentation to balance classes and boost sample count."""
    augmented = list(samples)
    label_counts = {}
    for _, label in samples:
        label_counts[label] = label_counts.get(label, 0) + 1

    major_templates = [
        "The {X} turns out to be the killer and murders {Y} in the final chapter.",
        "I can't believe {X} dies saving everyone. The ending was so heartbreaking.",
        "When {X} betrays {Y} and joins the villains, I was completely shocked.",
        "The plot twist where {X} was alive the whole time ruined it for me.",
        "So {X} was actually a ghost all along? That ending made no sense.",
        "I didn't expect {X} to sacrifice themselves to defeat {Y}. Devastating.",
        "Finding out {X} is the father of {Y} was the biggest twist in the book.",
        "The scene where {X} dies in {Y}'s arms was emotionally devastating.",
        "{X} revealing the truth about the war changed everything I thought I knew.",
        "The final battle between {X} and {Y} ends with both of them dying.",
        "I can't believe they killed off {X} after building up the character for 300 pages.",
        "The revelation that {X} was manipulating everyone the whole time was shocking.",
        "{Y} turns out to be the traitor and sells out {X} to the enemy.",
        "When {X} and {Y} finally get together but then {X} dies the next day.",
        "The ending where {X} sacrifices the world to save {Y} was selfish.",
        "I didn't see the {X} betrayal coming at all. Completely blindsided.",
        "The author really killed {X} off in the most brutal way possible.",
        "Finding out the whole story was a dream was such a cop-out ending.",
        "{X} becoming the villain after being the hero for the entire series was wild.",
        "The time travel reveal at the end completely recontextualized everything.",
    ]

    minor_templates = [
        "The {X} character arc was interesting but felt rushed in the second half.",
        "I have a feeling {X} might not be who they say they are.",
        "The relationship between {X} and {Y} seemed forced and unnatural.",
        "Something tells me {X} has a bigger role to play in future books.",
        "The pacing in the middle section dragged but the ending picked up.",
        "I suspected {X} early on but the author misdirected well.",
        "The world-building was solid but some plot points felt predictable.",
        "The magic system was creative though some rules seemed inconsistent.",
        "The romance subplot between {X} and {Y} felt underdeveloped.",
        "The political intrigue was complex but rewarding to follow.",
        "The author drops several hints about {X}'s true identity early on.",
        "The story has multiple POV characters which can be disorienting at first.",
        "The flashback chapters were insightful but disrupted the main narrative flow.",
        "I liked the moral ambiguity of {X} but it made the story harder to follow.",
    ]

    safe_templates = [
        "This is a wonderful book about {topic}. Highly recommend!",
        "The writing style is beautiful and the pacing is perfect.",
        "I couldn't put this down. {topic} at its finest.",
        "The character development throughout the story was fantastic.",
        "Great book for anyone interested in {topic}. Well researched.",
        "The themes of {topic} really resonated with me personally.",
        "Beautiful prose and vivid descriptions throughout.",
        "The dialogue was sharp and every character felt unique.",
        "This book changed my perspective on {topic}. Must read.",
        "The author's storytelling ability is truly remarkable.",
        "I loved the world-building and the detailed setting descriptions.",
        "The humor was perfectly placed and kept me entertained.",
        "Every chapter ended with a hook that made me keep reading.",
        "The exploration of {topic} was thoughtful and nuanced.",
        "The narrative structure was innovative and engaging.",
        "I appreciated the diversity of characters and perspectives.",
        "The audiobook narration was excellent, highly recommend that format.",
        "This was a perfect comfort read for me this summer.",
    ]

    topics = ["productivity", "personal growth", "friendship", "leadership", "creativity",
              "resilience", "psychology", "habits", "self-improvement", "learning",
              "adventure", "mystery", "romance", "technology", "science"]

    characters = ["the protagonist", "the detective", "the narrator", "the mentor",
                  "the villain", "the sidekick", "the love interest", "the leader"]

    target = max(label_counts.values()) if label_counts else 20
    target = max(target, 15)

    for label, templates, pool in [
        (2, major_templates, characters),
        (1, minor_templates, characters),
        (0, safe_templates, topics),
    ]:
        current = label_counts.get(label, 0)
        needed = max(0, target - current)
        for i in range(needed):
            tmpl = templates[i % len(templates)]
            text = tmpl
            if "{X}" in text:
                text = text.replace("{X}", pool[i % len(pool)])
            if "{Y}" in text:
                text = text.replace("{Y}", pool[(i + 1) % len(pool)])
            if "{topic}" in text:
                text = text.replace("{topic}", pool[i % len(pool)])
            augmented.append((text, label))

    return augmented


class SpoilerDataset(Dataset):
    """PyTorch dataset for spoiler detection."""

    def __init__(self, texts: List[str], labels: List[int], tokenizer, max_len: int = 128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        encoding = self.tokenizer(
            self.texts[idx],
            max_length=self.max_len,
            padding="max_length",
            truncation=True,
            return_tensors="pt",
        )
        return {
            "input_ids": encoding["input_ids"].squeeze(),
            "attention_mask": encoding["attention_mask"].squeeze(),
            "labels": torch.tensor(self.labels[idx], dtype=torch.long),
        }


def train_epoch(model, dataloader, optimizer, scheduler, device):
    """Train for one epoch."""
    model.train()
    total_loss = 0
    correct = 0
    total = 0

    for batch in dataloader:
        input_ids = batch["input_ids"].to(device)
        attention_mask = batch["attention_mask"].to(device)
        labels = batch["labels"].to(device)

        outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
        loss = outputs.loss
        logits = outputs.logits

        preds = torch.argmax(logits, dim=-1)
        correct += (preds == labels).sum().item()
        total += labels.size(0)

        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
        scheduler.step()
        optimizer.zero_grad()

        total_loss += loss.item()

    return total_loss / len(dataloader), correct / total


def evaluate(model, dataloader, device):
    """Evaluate model."""
    model.eval()
    total_loss = 0
    correct = 0
    total = 0
    all_preds = []
    all_labels = []

    with torch.no_grad():
        for batch in dataloader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels = batch["labels"].to(device)

            outputs = model(input_ids=input_ids, attention_mask=attention_mask, labels=labels)
            loss = outputs.loss
            logits = outputs.logits

            preds = torch.argmax(logits, dim=-1)
            correct += (preds == labels).sum().item()
            total += labels.size(0)
            total_loss += loss.item()

            all_preds.extend(preds.cpu().numpy())
            all_labels.extend(labels.cpu().numpy())

    accuracy = correct / total if total > 0 else 0
    avg_loss = total_loss / len(dataloader) if len(dataloader) > 0 else 0

    per_class = {}
    for label_id in range(3):
        mask = [i for i, l in enumerate(all_labels) if l == label_id]
        if mask:
            class_correct = sum(1 for i in mask if all_preds[i] == label_id)
            per_class[ID_TO_LABEL[label_id]] = class_correct / len(mask)

    return avg_loss, accuracy, per_class


def export_to_onnx(model, tokenizer, output_path: Path):
    """Export fine-tuned model to ONNX format."""
    print(f"\nExporting to ONNX at {output_path}...")

    model.eval()
    output_path.mkdir(parents=True, exist_ok=True)

    dummy_input = tokenizer(
        "This is a test review for export.",
        max_length=128,
        padding="max_length",
        truncation=True,
        return_tensors="pt",
    )

    torch.onnx.export(
        model,
        (
            dummy_input["input_ids"],
            dummy_input["attention_mask"],
        ),
        str(output_path / "spoiler-detector.onnx"),
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size", 1: "sequence_length"},
            "attention_mask": {0: "batch_size", 1: "sequence_length"},
            "logits": {0: "batch_size"},
        },
        opset_version=14,
    )

    print(f"ONNX model exported to: {output_path / 'spoiler-detector.onnx'}")
    return output_path / "spoiler-detector.onnx"


def main():
    parser = argparse.ArgumentParser(description="Fine-tune DistilBERT for spoiler detection")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--lr", type=float, default=2e-5, help="Learning rate")
    parser.add_argument("--batch-size", type=int, default=8, help="Batch size")
    parser.add_argument("--max-len", type=int, default=128, help="Max sequence length")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    parser.add_argument("--dry-run", action="store_true", help="Load data and print stats without training")
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)

    print("=" * 60)
    print("SpoilBERT: Fine-tuning DistilBERT for Spoiler Detection")
    print("=" * 60)

    all_samples = []

    if GENERAL_DATA.exists():
        print(f"\nLoading general training data: {GENERAL_DATA.name}")
        general_samples = load_conversational_jsonl(GENERAL_DATA)
        print(f"  Loaded {len(general_samples)} samples")
        all_samples.extend(general_samples)

    book_dirs = [TRAINING_DATA_DIR]
    for data_dir in book_dirs:
        if data_dir.exists():
            for jsonl_file in sorted(data_dir.glob("spoiler-train-*.jsonl")):
                print(f"  Loading {jsonl_file.name}...")
                book_samples = load_conversational_jsonl(jsonl_file)
                print(f"    Loaded {len(book_samples)} samples")
                all_samples.extend(book_samples)

    if not all_samples:
        print("\nERROR: No training data found!")
        sys.exit(1)

    print(f"\nTotal raw samples: {len(all_samples)}")

    augmented = augment_data(all_samples)
    print(f"After augmentation: {len(augmented)}")

    random.shuffle(augmented)

    label_dist = {}
    for _, label in augmented:
        name = ID_TO_LABEL[label]
        label_dist[name] = label_dist.get(name, 0) + 1
    print(f"\nLabel distribution:")
    for name, count in sorted(label_dist.items()):
        print(f"  {name}: {count}")

    if args.dry_run:
        print("\n[DRY RUN] Exiting without training.")
        return

    tokenizer = DistilBertTokenizer.from_pretrained("distilbert-base-uncased")
    model = DistilBertForSequenceClassification.from_pretrained(
        "distilbert-base-uncased", num_labels=3
    )

    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"\nUsing device: {device}")
    model.to(device)

    texts = [s[0] for s in augmented]
    labels = [s[1] for s in augmented]

    split_idx = int(0.85 * len(texts))
    train_texts, val_texts = texts[:split_idx], texts[split_idx:]
    train_labels, val_labels = labels[:split_idx], labels[split_idx:]

    print(f"\nTrain: {len(train_texts)}, Val: {len(val_texts)}")

    train_dataset = SpoilerDataset(train_texts, train_labels, tokenizer, args.max_len)
    val_dataset = SpoilerDataset(val_texts, val_labels, tokenizer, args.max_len)

    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    val_loader = DataLoader(val_dataset, batch_size=args.batch_size)

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=0.01)
    total_steps = len(train_loader) * args.epochs
    scheduler = get_linear_schedule_with_warmup(optimizer, num_warmup_steps=int(0.1 * total_steps), num_training_steps=total_steps)

    print(f"\nStarting training for {args.epochs} epochs...")
    print(f"  Steps/epoch: {len(train_loader)}")
    print(f"  Total steps: {total_steps}")
    print(f"  Learning rate: {args.lr}")
    print()

    best_val_acc = 0
    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_epoch(model, train_loader, optimizer, scheduler, device)
        val_loss, val_acc, per_class = evaluate(model, val_loader, device)

        print(f"Epoch {epoch:3d}/{args.epochs} | "
              f"train_loss={train_loss:.4f} acc={train_acc:.3f} | "
              f"val_loss={val_loss:.4f} acc={val_acc:.3f}")

        if per_class:
            parts = " | ".join(f"{k}={v:.2f}" for k, v in per_class.items())
            print(f"           per-class: {parts}")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            MODEL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
            model.save_pretrained(str(MODEL_OUTPUT_DIR))
            tokenizer.save_pretrained(str(MODEL_OUTPUT_DIR))
            print(f"           -> saved best model (val_acc={val_acc:.3f})")

    print(f"\nTraining complete. Best val accuracy: {best_val_acc:.3f}")

    print(f"\nLoading best model for ONNX export...")
    best_model = DistilBertForSequenceClassification.from_pretrained(str(MODEL_OUTPUT_DIR))
    best_model.to(device)

    onnx_path = ONNX_OUTPUT_DIR
    export_to_onnx(best_model, tokenizer, onnx_path)

    print(f"\nTokenizer saved alongside ONNX model.")
    tokenizer.save_pretrained(str(onnx_path))

    print(f"\nDone! Restart the backend to use the fine-tuned model.")


if __name__ == "__main__":
    main()
