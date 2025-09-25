FROM node:18-alpine

# アプリケーションディレクトリを作成
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production=false

# アプリケーションのソースをコピー
COPY . .

# 開発サーバーのポートを公開
EXPOSE 3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# 開発サーバーを起動
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]