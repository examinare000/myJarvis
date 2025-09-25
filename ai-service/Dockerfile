FROM python:3.11-slim

# 必要なツールをインストール
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Ollamaをインストール
RUN curl -fsSL https://ollama.ai/install.sh | sh

# アプリケーションディレクトリを作成
WORKDIR /app

# Python依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースをコピー
COPY . .

# ポートを公開
EXPOSE 8000 11434

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 起動スクリプトをコピーして実行権限を付与
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

# スタートアップスクリプトを実行
CMD ["/app/start.sh"]