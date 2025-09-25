# myJarvis - 個人向けAIアシスタント

myJarvisは、カレンダー、タスクリスト、ライフログを統合して最適なタスク消化スケジュールを提供する個人向けAIアシスタントです。

## 🚀 機能

- **スマートスケジューリング**: AI駆動の最適なタスク配置
- **外部サービス連携**: Google Calendar、Gmail、Slack等との統合
- **リアルタイム通知**: 適切なタイミングでのタスクリマインダー
- **学習機能**: ユーザーの行動パターンから最適化を改善
- **プライバシー重視**: ローカル環境でのデータ保存

## 🏗 アーキテクチャ

- **フロントエンド**: React + TypeScript + Material-UI
- **バックエンド**: Node.js + Express + Prisma
- **データベース**: SQLite
- **AI処理**: Ollama + ローカルLLM
- **インフラ**: Docker + Docker Compose

## 📋 前提条件

- Docker Desktop
- Docker Compose
- 8GB以上のメモリ (AI処理のため)

## 🚀 セットアップ手順

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd myJarvis
```

### 2. 環境変数の設定
```bash
cp .env.example .env
# 必要に応じて .env ファイルを編集
```

### 3. Docker環境の起動
```bash
# 全サービスを一括起動
docker-compose up -d

# ログを確認
docker-compose logs -f
```

### 4. データベースの初期化
```bash
# バックエンドコンテナでマイグレーション実行
docker-compose exec backend npm run db:migrate
```

### 5. 初期データの投入（オプション）
```bash
docker-compose exec backend npm run db:seed
```

## 🌐 アクセス

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001
- **AI・MLサービス**: http://localhost:8000
- **Ollama API**: http://localhost:11434

## 📁 プロジェクト構造

```
myJarvis/
├── docker-compose.yml          # Docker Compose設定
├── .env.example                # 環境変数テンプレート
├── README.md                   # このファイル
├── docs/                       # ドキュメント
│   ├── adr/                   # Architecture Decision Records
│   └── design/                # 設計ドキュメント
├── frontend/                   # Reactフロントエンド
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── backend/                    # Node.jsバックエンド
│   ├── Dockerfile
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
├── ai-service/                 # Python AI・MLサービス
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
└── data/                      # データ永続化
    └── sqlite/               # SQLiteデータベースファイル
```

## 🛠 開発コマンド

### Docker操作
```bash
# サービス起動
docker-compose up -d

# サービス停止
docker-compose down

# ログ確認
docker-compose logs -f [service-name]

# コンテナ内でコマンド実行
docker-compose exec [service-name] [command]
```

### データベース操作
```bash
# マイグレーション適用
docker-compose exec backend npm run db:migrate

# Prismaスタジオ起動
docker-compose exec backend npm run db:studio

# データベースリセット
docker-compose exec backend npx prisma migrate reset
```

### AI・MLサービス
```bash
# Ollamaモデル一覧確認
docker-compose exec ai-service ollama list

# 新しいモデルのダウンロード
docker-compose exec ai-service ollama pull llama2:13b
```

## 🔧 トラブルシューティング

### よくある問題

#### 1. ポートが既に使用中
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :8000

# Dockerコンテナを完全停止
docker-compose down --volumes
```

#### 2. Ollamaモデルのダウンロードに時間がかかる
```bash
# 軽量モデルに変更
docker-compose exec ai-service ollama pull llama2:7b
```

#### 3. データベース接続エラー
```bash
# データベースファイルの権限確認
ls -la data/sqlite/

# コンテナを再構築
docker-compose up --build backend
```

#### 4. メモリ不足
```bash
# Dockerのメモリ割り当てを増やす
# Docker Desktop > Settings > Resources > Advanced
# Memory: 8GB以上推奨
```

### ログの確認
```bash
# 全サービスのログ
docker-compose logs

# 特定サービスのログ
docker-compose logs frontend
docker-compose logs backend
docker-compose logs ai-service
```

## 📊 ヘルスチェック

### サービス状態確認
```bash
# ヘルスチェック状態確認
docker-compose ps

# 手動ヘルスチェック
curl http://localhost:3000/        # Frontend
curl http://localhost:3001/health  # Backend
curl http://localhost:8000/health  # AI Service
```

## 🔒 セキュリティ

- SQLiteファイルは適切なファイル権限で保護
- JWT秘密鍵は本番環境で必ず変更
- 外部サービス認証情報は暗号化して保存
- CORS設定で適切なオリジン制限

## 📝 開発ガイド

- [API仕様書](docs/design/api-specification.md)
- [データベース設計](docs/design/database-schema.md)
- [システムアーキテクチャ](docs/design/web-architecture.md)
- [ADRドキュメント](docs/adr/)

## 🤝 コントリビューション

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m '機能: 素晴らしい機能を追加'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](LICENSE)ファイルを参照してください。

## 🆘 サポート

問題やバグを発見した場合は、[Issues](../../issues)でご報告ください。

---

**作成日**: 2025-09-26
**バージョン**: 0.1.0
**メンテナー**: myJarvis Team