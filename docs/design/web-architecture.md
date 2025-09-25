# myJarvis Webアプリケーション アーキテクチャ設計

## 概要

myJarvisのWebアプリケーション版における技術選定とアーキテクチャの詳細設計書です。
ローカル環境での動作を重視し、プライバシー保護を最優先としています。

## 技術スタック

### フロントエンド
- **React 18** + **TypeScript** + **Vite**
- **UI Framework**: Material-UI (MUI) v5
- **状態管理**: Redux Toolkit + RTK Query
- **ルーティング**: React Router v6

#### 選定理由
- **React**: 豊富なエコシステム、コミュニティサポート
- **TypeScript**: 型安全性による開発効率向上
- **Vite**: 高速な開発体験、HMR
- **MUI**: 高品質なコンポーネント、アクセシビリティ対応

### バックエンド
- **Node.js 18 LTS** + **Express.js** + **TypeScript**
- **ORM**: Prisma
- **認証**: Passport.js + JWT
- **バリデーション**: Zod
- **ログ**: Winston

#### 選定理由
- **Node.js**: フロントエンドと言語統一、ローカル環境構築容易
- **Express**: シンプルで拡張性が高い
- **Prisma**: 型安全なORM、優れたDX

### データベース
- **SQLite** (開発・ローカル環境)
- **PostgreSQL** (将来のクラウド展開用)

#### 選定理由
- **SQLite**: ファイルベース、セットアップ不要、プライバシー重視
- **Prisma**: マイグレーション管理、型生成

### AI・ML統合
- **LLM**: Ollama + Llama 2/3 (ローカル実行)
- **ML**: Python + scikit-learn (別プロセス)
- **通信**: REST API / WebSocket

#### 選定理由
- **Ollama**: ローカルLLM実行、プライバシー保護
- **Python**: ML/データサイエンス豊富なライブラリ

## システムアーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   AI/ML         │
│   (React)       │◄──►│   (Node.js)     │◄──►│   (Python)      │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Components  │ │    │ │ REST API    │ │    │ │ Ollama      │ │
│ │ (MUI)       │ │    │ │ (Express)   │ │    │ │ (LLM)       │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ State Mgmt  │ │    │ │ Database    │ │    │ │ ML Models   │ │
│ │ (Redux)     │ │    │ │ (SQLite)    │ │    │ │ (scikit)    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                    ┌─────────────────┐
                    │ External APIs   │
                    │ (Google, Slack) │
                    └─────────────────┘
```

## データフロー

### 1. タスク取得・処理フロー
```
外部API → Backend → SQLite → Frontend → 表示
                ↓
          AI処理要求 → Python ML Service → 最適化結果 → SQLite
```

### 2. スケジューリングフロー
```
ユーザー入力 → Frontend → Backend → AI処理 → ML最適化 → 結果表示
```

## コンポーネント設計

### フロントエンド構成
```
src/
├── components/          # 共通コンポーネント
│   ├── Calendar/       # カレンダー表示
│   ├── TaskList/       # タスク一覧
│   ├── Dashboard/      # ダッシュボード
│   └── Notifications/  # 通知管理
├── pages/              # ページコンポーネント
├── store/              # Redux store
├── api/                # API通信
├── hooks/              # カスタムフック
├── utils/              # ユーティリティ
└── types/              # TypeScript型定義
```

### バックエンド構成
```
src/
├── routes/             # APIルート
│   ├── auth.ts         # 認証
│   ├── tasks.ts        # タスク管理
│   ├── calendar.ts     # カレンダー
│   └── ai.ts           # AI処理
├── services/           # ビジネスロジック
├── models/             # データモデル
├── middleware/         # ミドルウェア
├── utils/              # ユーティリティ
└── types/              # TypeScript型定義
```

## API設計方針

### RESTful API
```
GET    /api/tasks           # タスク一覧取得
POST   /api/tasks           # タスク作成
PUT    /api/tasks/:id       # タスク更新
DELETE /api/tasks/:id       # タスク削除

GET    /api/calendar/events # カレンダーイベント取得
POST   /api/ai/optimize     # スケジュール最適化
```

### WebSocket (リアルタイム通知)
```
/ws/notifications          # 通知配信
/ws/task-updates          # タスク更新
```

## セキュリティ設計

### 認証・認可
- **JWT**: ステートレス認証
- **リフレッシュトークン**: セキュア更新
- **CORS**: 適切なオリジン制限

### データ保護
- **暗号化**: 機密データのAES暗号化
- **ローカル保存**: SQLiteファイルの適切な権限設定
- **API通信**: HTTPS必須

## パフォーマンス最適化

### フロントエンド
- **Code Splitting**: React.lazy + Suspense
- **メモ化**: React.memo, useMemo, useCallback
- **バンドル最適化**: Viteの自動最適化活用

### バックエンド
- **接続プール**: SQLite接続管理
- **キャッシュ**: Redis (将来導入)
- **非同期処理**: Promise, async/await

### AI・ML処理
- **バッチ処理**: 複数タスクの一括最適化
- **キャッシュ**: 計算結果の保存・再利用
- **モデル最適化**: 軽量モデルの選択

## 開発環境構成

### 必要なツール
```bash
# Node.js環境
node --version  # 18 LTS
npm --version   # 8+

# Python環境 (AI・ML用)
python --version  # 3.9+
pip --version

# データベース
sqlite3 --version

# AI・ML
ollama --version
```

### セットアップ手順
```bash
# 1. 依存関係インストール
npm install

# 2. データベース初期化
npx prisma generate
npx prisma migrate dev

# 3. AI環境セットアップ
ollama pull llama2
pip install -r ml-requirements.txt

# 4. 開発サーバー起動
npm run dev        # フロントエンド
npm run server     # バックエンド
python ml-server.py # AI・ML
```

## 将来拡張への考慮

### iOS連携準備
- **API First**: RESTful設計で他プラットフォーム対応
- **データ同期**: 将来のクラウド同期に備えた設計

### クラウド展開
- **環境分離**: development/staging/production
- **スケーラビリティ**: マイクロサービス化への準備

### 機能拡張
- **プラグイン機能**: 外部サービス連携の拡張性
- **ML学習**: ユーザー行動学習による最適化改善

## 次のステップ

1. **プロジェクト初期化**: package.json, 環境設定
2. **データベース設計**: Prismaスキーマ作成
3. **基本API実装**: 認証、タスク管理
4. **フロントエンド基盤**: React + MUI セットアップ
5. **AI統合**: Ollama連携実装

---

**作成日**: 2025-09-26
**更新日**: 2025-09-26
**バージョン**: 1.0
**レビュアー**: Claude Code