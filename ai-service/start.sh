#!/bin/bash
set -e

# Ollamaサーバーをバックグラウンドで起動
ollama serve &

# Ollamaサーバーの起動を待つ
echo "Waiting for Ollama server to start..."
while ! curl -s http://localhost:11434/api/tags > /dev/null; do
    sleep 2
done
echo "Ollama server started"

# 初回起動時にモデルをダウンロード (サイズが小さいモデルを選択)
if [ ! -f /root/.ollama/models/registry.ollama.ai/library/llama2/7b ]; then
    echo "Downloading Llama2 7B model..."
    ollama pull llama2:7b
fi

# Pythonアプリケーションを起動
exec python -m uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload