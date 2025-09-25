FROM node:18-alpine

# 必要なツールをインストール
RUN apk add --no-cache sqlite openssl ca-certificates

# アプリケーションディレクトリを作成
WORKDIR /app

# パッケージ管理ファイルをコピー
COPY package*.json ./

# 依存関係をインストール
RUN npm ci --only=production=false

# Prisma クライアントを生成
COPY prisma ./prisma/
RUN npx prisma generate

# アプリケーションのソースをコピー
COPY . .

# データディレクトリを作成
RUN mkdir -p /app/data

# ポートを公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/health || exit 1

# アプリケーションを起動
CMD ["npm", "run", "dev"]