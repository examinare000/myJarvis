# Phase 2 開発ロードマップ - Enhanced Features

## 📅 期間: 2025年10月〜12月（予定）

## 🎯 Phase 2 の目標
Critical Featuresの基盤を活用し、カレンダー機能とAI統合によってmyJarvisを真のパーソナルアシスタントに進化させる。

## ✅ Phase 1 完了項目（前提条件）
- ✅ PostgreSQL + Prisma ORMによるデータベース基盤
- ✅ TDD実装によるバックエンドAPI（Tasks、Lifelog）
- ✅ React + TypeScript フロントエンド（Port 8080）
- ✅ Zustand + React Query による状態管理
- ✅ Material-UI コンポーネント基盤

## 🎯 Phase 2 優先機能

### 🗓️ Priority 1: カレンダー機能実装

#### 1.1 標準カレンダービュー
**技術要件**:
- React-Big-Calendar または react-calendar 採用
- 月/週/日 表示切り替え
- タスクとの統合表示
- ドラッグ&ドロップによるタスク移動

**実装ステップ**:
1. カレンダーライブラリ選定（Gemini調査）
2. CalendarViewコンポーネント作成
3. 既存Taskモデルとの連携
4. イベント作成・編集UI

**期間**: 2週間

#### 1.2 自然言語カレンダー入力
**技術要件**:
- 「明日の14時に会議」形式の入力解析
- 日本語対応の日時パーサー
- AI/LLMによる自然言語処理

**実装ステップ**:
1. 日本語日時パーサーライブラリ調査
2. AIパーサーAPI設計・実装
3. 入力コンポーネント作成
4. バリデーション・エラーハンドリング

**期間**: 3週間

### 🤖 Priority 2: AI統合

#### 2.1 AI チャット機能
**技術要件**:
- Ollama または OpenAI API統合
- ストリーミングレスポンス
- コンテキスト保持
- タスク・カレンダーとの連携

**実装ステップ**:
1. AI Service選定（Ollama vs OpenAI）
2. WebSocket経由のストリーミング実装
3. チャットUIコンポーネント
4. コンテキスト管理システム

**期間**: 3週間

#### 2.2 インテリジェント・タスク提案
**技術要件**:
- ライフログ分析による行動パターン学習
- 最適なタスクスケジューリング提案
- 優先度自動調整

**実装ステップ**:
1. 行動パターン分析アルゴリズム
2. スケジューリング最適化ロジック
3. 提案UI実装
4. ユーザーフィードバック機能

**期間**: 4週間

### 🔐 Priority 3: 認証システム

#### 3.1 ユーザー認証・認可
**技術要件**:
- JWT認証の完全実装
- ユーザー登録・ログイン
- セッション管理
- セキュリティ強化

**実装ステップ**:
1. 認証API完成（現在test-user固定）
2. ログイン・登録UI
3. 認証状態管理
4. セキュリティテスト

**期間**: 2週間

## 📊 技術的検討事項

### カレンダーライブラリ選定
| ライブラリ | 評価 | 理由 |
|------------|------|------|
| react-big-calendar | ⭐⭐⭐⭐⭐ | 高機能、Google Calendar風UI |
| react-calendar | ⭐⭐⭐ | 軽量、シンプル |
| @mui/x-date-pickers | ⭐⭐⭐⭐ | Material-UIとの親和性 |

**推奨**: react-big-calendar（多機能性重視）

### AI Service選定
| Service | 評価 | 理由 |
|---------|------|------|
| Ollama (Local) | ⭐⭐⭐⭐ | プライバシー保護、コスト無し |
| OpenAI API | ⭐⭐⭐⭐⭐ | 高性能、信頼性 |
| Google Gemini | ⭐⭐⭐⭐ | 多言語対応、統合性 |

**推奨**: Ollama（ローカル）+ OpenAI（フォールバック）

### 自然言語処理選択肢
1. **クライアント側**: chrono-node（軽量）
2. **サーバー側**: OpenAI Function Calling
3. **ハイブリッド**: 基本解析（ローカル）+ 複雑解析（AI）

## 🏗️ アーキテクチャ拡張

### 新しいサービス構成
```
Frontend (Port 8080)
├── Calendar Components
├── AI Chat Interface
└── Auth Components

Backend (Port 3002)
├── Calendar API
├── AI Proxy Service
└── Auth Service

AI Service (Port 8000) - 新規
├── Ollama Integration
├── Natural Language Parser
└── Task Intelligence

Database
├── Existing Tables
├── calendar_events (実装済み)
└── conversations (実装済み)
```

### 新しいAPIエンドポイント
```
# Calendar API
GET    /api/v1/calendar/events
POST   /api/v1/calendar/events
PUT    /api/v1/calendar/events/:id
DELETE /api/v1/calendar/events/:id
POST   /api/v1/calendar/parse-natural-language

# AI API
POST   /api/v1/ai/chat
GET    /api/v1/ai/suggestions
POST   /api/v1/ai/schedule-optimize

# Auth API (拡張)
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
DELETE /api/v1/auth/logout
```

## 📈 成功指標

### ユーザー体験
- [ ] カレンダーでのタスク管理が直感的
- [ ] 自然言語入力の正確性 > 85%
- [ ] AI提案の採用率 > 60%
- [ ] レスポンス時間 < 2秒

### 技術品質
- [ ] テストカバレッジ > 90%
- [ ] TypeScript厳格モード準拠
- [ ] セキュリティスキャン通過
- [ ] パフォーマンス基準達成

### 開発効率
- [ ] TDD継続実践
- [ ] Agentic Coding活用
- [ ] ドキュメント更新
- [ ] ADR記録

## 🎯 Phase 2 マイルストーン

### Milestone 1: カレンダー基盤（4週間）
- Week 1-2: ライブラリ選定・基本実装
- Week 3-4: タスク統合・UI完成

### Milestone 2: AI統合（6週間）
- Week 5-7: AI Service構築
- Week 8-10: 自然言語処理実装

### Milestone 3: 認証・完成（2週間）
- Week 11: 認証システム実装
- Week 12: 統合テスト・最適化

## 🔄 継続的改善

### 週次レビュー
- 進捗確認
- 技術的課題の洗い出し
- ユーザーフィードバック収集

### 品質管理
- 毎週のテスト実行
- セキュリティチェック
- パフォーマンス監視

## 🚀 Phase 3 への準備

Phase 2完了後の発展項目：
- モバイルアプリ開発
- 外部サービス連携拡張
- チーム機能
- 高度なAI機能

---

**Next Action**: カレンダーライブラリ調査開始（Gemini担当）