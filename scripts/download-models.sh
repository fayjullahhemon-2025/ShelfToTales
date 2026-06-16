#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -eo pipefail

# Resolve directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="$PROJECT_ROOT/backend/shelfToTales/src/main/resources/models"

echo "=== ShelfToTales AI Model Downloader ==="
echo "Project Root:     $PROJECT_ROOT"
echo "Target Directory: $TARGET_DIR"
echo ""

# Create models directory if it doesn't exist
mkdir -p "$TARGET_DIR"

MODEL_URL="https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/onnx/model_quantized.onnx"
TOKENIZER_URL="https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/tokenizer.json"

MODEL_DEST="$TARGET_DIR/all-MiniLM-L6-v2.onnx"
TOKENIZER_DEST="$TARGET_DIR/tokenizer.json"

# Helper function to download files
download_file() {
    local url="$1"
    local dest="$2"
    local name="$3"

    echo "Downloading $name..."
    if command -v curl >/dev/null 2>&1; then
        curl -L -o "$dest" "$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -O "$dest" "$url"
    else
        echo "Error: Neither curl nor wget is installed on this system. Please install one to proceed." >&2
        exit 1
    fi
    
    # Check if downloaded file exists and is not empty
    if [ ! -s "$dest" ]; then
        echo "Error: Failed to download $name. File is empty or does not exist." >&2
        exit 1
    fi
    echo "Successfully downloaded $name."
}

# Download model
download_file "$MODEL_URL" "$MODEL_DEST" "ONNX Embedding Model (23MB)"

# Download tokenizer
download_file "$TOKENIZER_URL" "$TOKENIZER_DEST" "HuggingFace Tokenizer (466KB)"

echo ""
echo "=== Setup Complete! ==="
echo "Model and tokenizer saved in: $TARGET_DIR"
echo "Start/restart the Spring Boot backend to activate semantic search."
