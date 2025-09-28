# ADR-001: ダッシュボードアーキテクチャ設計

## ステータス
承認済み

## 日付
2025-09-27

## 決定者
myJarvis開発チーム

## コンテキスト

myJarvisのWebダッシュボードとして、以下の4つの主要機能を統合する必要がある：

1. **標準カレンダービュー** - 月/週/日表示でのスケジュール管理
2. **自然言語カレンダー入力** - "明日の3時に会議"のような自然な予定入力
3. **Twitter風ライフログ** - 日常の簡単な記録とタイムライン表示
4. **当日タスク優先度表示** - 今日のタスクと重要度の可視化

これらの機能を効率的に統合し、優れたユーザーエクスペリエンスを提供するアーキテクチャが必要である。

## 検討した選択肢

### 選択肢1: 単一ページアプリケーション（SPA）
- **利点**: シームレスなUX、高速な画面遷移
- **欠点**: 初期読み込み時間、SEOの課題

### 選択肢2: マルチページアプリケーション（MPA）
- **利点**: SEO対応、ページ単位の最適化
- **欠点**: ページ遷移の遅さ、状態管理の複雑化

### 選択肢3: ハイブリッドアプローチ（統合ダッシュボード）
- **利点**: 全機能を一画面で利用、コンテキスト保持
- **欠点**: 画面の複雑さ、コンポーネント間の依存関係

## 決定

**選択肢3: ハイブリッドアプローチ（統合ダッシュボード）** を採用する。

### 理由

1. **ユーザビリティ**: 4つの機能が密接に関連しており、一画面での利用が最も効率的
2. **コンテキスト保持**: タスク→カレンダー→ライフログの連携がスムーズ
3. **レスポンシブ対応**: グリッドレイアウトでモバイル/デスクトップ両対応

## アーキテクチャ詳細

### レイアウト構成
```
Desktop (1200px+):     3列レイアウト
┌─────────────────┬─────────────────┬─────────────────┐
│  Today's Tasks  │ Calendar View   │ Natural Lang    │
│   & Priority    │  (Month/Week)   │ Calendar Input  │
└─────────────────┴─────────────────┴─────────────────┘
┌─────────────────────────────────────────────────────┐
│               Twitter-style Lifelog                │
└─────────────────────────────────────────────────────┘

Mobile (〜767px):      1列縦スタック
┌─────────────────┐
│  Today's Tasks  │
├─────────────────┤
│ Calendar View   │
├─────────────────┤
│ Natural Lang    │
├─────────────────┤
│    Lifelog      │
└─────────────────┘
```

### コンポーネント階層
```
MainDashboard
├── DashboardHeader
├── DashboardGrid
│   ├── TodayTasksPanel
│   ├── CalendarView
│   ├── NaturalLanguageInput
│   └── LifelogSection
│       ├── LifelogInput
│       └── LifelogTimeline
└── DashboardFooter
```

### 状態管理戦略
- **React Context API** - 軽量でシンプルな状態管理
- **コンポーネント別Context** - 機能単位での状態分離
- **React Query** - サーバー状態の管理とキャッシュ

### データフロー
```
User Interaction
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    UI       │────▶│   Context   │────▶│   Backend   │
│ Components  │     │  Providers  │     │    APIs     │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                    │                    │
       │                    ▼                    ▼
       │            ┌─────────────┐     ┌─────────────┐
       └────────────│ Local State │     │  WebSocket  │
                    └─────────────┘     └─────────────┘
```

## 技術選択

### フロントエンド
- **React 18** - Concurrent Features活用
- **TypeScript** - 型安全性とDeveloper Experience
- **Material-UI v5** - 統一されたデザインシステム
- **React Router v6** - クライアントサイドルーティング
- **React Query** - サーバー状態管理
- **Socket.io-client** - リアルタイム通信

### データベース
- **PostgreSQL** - 関係データとJSONBサポート
- **Prisma** - 型安全なORM

### 新規テーブル設計
```sql
-- ライフログエントリ
lifelog_entries (
  id, user_id, content, tags, mood, images,
  location_lat, location_lng, location_name,
  created_at, updated_at
)

-- カレンダーイベント
calendar_events (
  id, user_id, title, description, start_time, end_time,
  category, color, location, is_all_day, recurrence_rule,
  created_at, updated_at
)

-- 自然言語解析ログ
nl_parse_logs (
  id, user_id, input_text, parsed_result,
  confidence_score, user_accepted, created_at
)
```

## パフォーマンス対策

1. **コード分割**: React.lazy による機能単位の分割
2. **仮想化**: react-window によるライフログの効率表示
3. **メモ化**: React.memo, useMemo, useCallback の適切な使用
4. **キャッシュ**: React Query による intelligent caching
5. **画像最適化**: WebP対応とresponsive images

## セキュリティ考慮事項

1. **XSS対策**: DOMPurifyによる入力サニタイズ
2. **CSRF対策**: JWT tokenベース認証
3. **プライバシー**: 位置情報のオプトイン
4. **画像アップロード**: ファイル形式・サイズ制限

## 監視・可観測性

1. **エラー監視**: Sentryでクライアントエラー追跡
2. **パフォーマンス**: Web Vitalsの監視
3. **使用率分析**: 機能別の利用統計

## 移行戦略

### Phase 1: 基盤構築
- MainDashboard レイアウト
- TodayTasksPanel 実装
- 基本的なレスポンシブ対応

### Phase 2: コア機能
- CalendarView 実装
- LifelogInput/Timeline 実装
- データベーススキーマ追加

### Phase 3: 高度な機能
- NaturalLanguageInput 実装
- AI連携機能
- 音声入力対応

## リスク

1. **複雑性**: 統合ダッシュボードの複雑さによるUX低下
   - **軽減策**: プロトタイプによる早期検証

2. **パフォーマンス**: 多機能による初期読み込み遅延
   - **軽減策**: 段階的読み込みと仮想化

3. **保守性**: コンポーネント間の依存関係
   - **軽減策**: 明確なインターフェース設計

## 代替案の検討

今後の成長により複雑になった場合：
- **マイクロフロントエンド**: 機能単位での独立開発
- **状態管理ライブラリ**: Redux Toolkit, Zustand等への移行

## 成功指標

- **初期読み込み時間**: < 3秒
- **タスク作成時間**: < 30秒
- **カレンダー表示**: < 1秒
- **モバイル利用率**: > 60%
- **ユーザー満足度**: > 4.0/5.0

---

この決定は、現在の要件と技術的制約を踏まえた最適解である。市場フィードバックと技術の進歩に応じて、将来的に見直しを行う。