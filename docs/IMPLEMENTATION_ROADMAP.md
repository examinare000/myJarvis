# myJarvis Web UI 実装ロードマップ

## 🎯 プロジェクト目標

4つの主要機能を統合したダッシュボードの実装：
1. **標準カレンダービュー** - 月/週/日表示の切り替え可能なカレンダー
2. **自然言語カレンダー** - "明日の3時に会議"のような自然な入力
3. **Twitter風ライフログ** - 簡単な日常記録とタイムライン表示
4. **当日タスク優先度表示** - 今日のタスクと重要度の可視化

## 📅 実装スケジュール

### Phase 1: 基盤構築 (Week 1-2)
**目標**: 基本的なダッシュボードレイアウトと当日タスク表示

#### Week 1: プロジェクト構造とタスク表示
```bash
Day 1-2: プロジェクト構造の整理
□ フォルダ構成の最適化
□ TypeScript型定義の整備
□ 共通コンポーネントの作成

Day 3-4: 当日タスク優先度表示
□ TodayTasksPanel コンポーネント実装
□ TaskQuickCard コンポーネント実装
□ 優先度システムの実装
□ 進捗状況の可視化

Day 5-7: ダッシュボードレイアウト
□ MainDashboard コンポーネント実装
□ レスポンシブグリッドレイアウト
□ ヘッダー・サイドバーの改良
□ 基本的なナビゲーション
```

#### Week 2: Twitter風ライフログ
```bash
Day 8-10: ライフログ入力
□ LifelogInput コンポーネント実装
□ 280文字制限の入力欄
□ タグ機能 (#work, #personal)
□ 気分選択機能

Day 11-12: ライフログタイムライン
□ LifelogTimeline コンポーネント実装
□ LifelogCard コンポーネント実装
□ 時系列表示機能
□ 基本的な検索機能

Day 13-14: 統合テスト & 改良
□ ダッシュボードの統合テスト
□ レスポンシブ対応の確認
□ パフォーマンス最適化
□ バグ修正
```

### Phase 2: カレンダー機能 (Week 3-4)
**目標**: 標準カレンダービューとイベント管理

#### Week 3: 標準カレンダービュー
```bash
Day 15-17: カレンダーコンポーネント
□ CalendarView コンポーネント実装
□ 月表示・週表示・日表示の切り替え
□ 今日のハイライト表示
□ イベント表示機能

Day 18-19: イベント管理
□ EventForm コンポーネント実装
□ イベントの作成・編集・削除
□ ドラッグ&ドロップ機能
□ 色分け・カテゴリ管理

Day 20-21: データ統合
□ カレンダーAPI連携
□ タスクとイベントの連携
□ WebSocket リアルタイム更新
□ データ同期機能
```

#### Week 4: 自然言語入力（基本版）
```bash
Day 22-24: 自然言語パーサー
□ NaturalLanguageInput コンポーネント実装
□ 基本的な日時解析機能
□ "明日の3時"などの簡単なパターン対応
□ 確認ダイアログの実装

Day 25-26: AI連携準備
□ バックエンドのパーサーAPI実装
□ 解析結果の確認・修正機能
□ エラーハンドリング
□ ユーザビリティテスト

Day 27-28: 統合 & 最適化
□ 全機能の統合テスト
□ パフォーマンス最適化
□ UI/UX の改良
□ ドキュメント更新
```

### Phase 3: 高度な機能 (Week 5-6)
**目標**: AI機能強化と音声入力対応

#### Week 5: AI機能強化
```bash
Day 29-31: 高度な自然言語処理
□ 複雑な日時パターンの対応
□ 繰り返し予定の解析
□ 複数イベントの一括入力
□ 学習機能の実装

Day 32-33: 音声入力
□ Speech Recognition API の統合
□ 音声からテキストへの変換
□ ノイズ除去・音質向上
□ モバイル対応

Day 34-35: インテリジェント機能
□ AIによる予定提案
□ タスク優先度の自動調整
□ スケジュール最適化提案
□ 衝突検出・回避提案
```

#### Week 6: 拡張機能とポリッシュ
```bash
Day 36-37: 画像・位置情報機能
□ 画像アップロード機能
□ 位置情報の取得・表示
□ 画像プレビュー・編集
□ プライバシー設定

Day 38-39: 検索・フィルター
□ 高度な検索機能
□ 複合フィルター
□ 保存された検索
□ エクスポート機能

Day 40-42: 最終調整
□ 総合テスト
□ パフォーマンス最適化
□ セキュリティチェック
□ デプロイ準備
```

## 🛠 技術実装詳細

### データベース設計更新

#### 新しいテーブル定義
```sql
-- ライフログエントリ
CREATE TABLE lifelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  tags TEXT[],
  mood VARCHAR(20),
  images TEXT[],
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- カレンダーイベント
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  category VARCHAR(50),
  color VARCHAR(7),
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 自然言語解析ログ
CREATE TABLE nl_parse_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  input_text TEXT NOT NULL,
  parsed_result JSONB,
  confidence_score DECIMAL(3,2),
  user_accepted BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 既存Prismaスキーマの更新
```prisma
model LifelogEntry {
  id           String   @id @default(cuid())
  userId       String
  content      String
  tags         String[]
  mood         String?
  images       String[]
  locationLat  Float?
  locationLng  Float?
  locationName String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("lifelog_entries")
}

model CalendarEvent {
  id             String   @id @default(cuid())
  userId         String
  title          String
  description    String?
  startTime      DateTime
  endTime        DateTime
  category       String?
  color          String?
  location       String?
  isAllDay       Boolean  @default(false)
  recurrenceRule String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_events")
}

model NlParseLog {
  id               String   @id @default(cuid())
  userId           String
  inputText        String
  parsedResult     Json?
  confidenceScore  Float?
  userAccepted     Boolean?
  createdAt        DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("nl_parse_logs")
}
```

### API エンドポイント実装計画

#### Phase 1 API
```typescript
// 当日タスク
GET /api/v1/tasks/today
PUT /api/v1/tasks/:id/status

// ライフログ
GET /api/v1/lifelog/entries?limit=20&offset=0
POST /api/v1/lifelog/entries
PUT /api/v1/lifelog/entries/:id
DELETE /api/v1/lifelog/entries/:id
```

#### Phase 2 API
```typescript
// カレンダー
GET /api/v1/calendar/events?start=2024-01-01&end=2024-01-31
POST /api/v1/calendar/events
PUT /api/v1/calendar/events/:id
DELETE /api/v1/calendar/events/:id

// 自然言語解析
POST /api/v1/calendar/parse-natural-language
GET /api/v1/calendar/suggest-times
```

#### Phase 3 API
```typescript
// AI機能
POST /api/v1/ai/suggest-schedule
POST /api/v1/ai/optimize-tasks
GET /api/v1/ai/insights/productivity

// 画像・位置情報
POST /api/v1/lifelog/upload-image
GET /api/v1/lifelog/nearby-entries
```

### フロントエンド開発順序

#### 1. コンポーネント作成順序
```
1. TodayTasksPanel (基本)
2. TaskQuickCard (タスク表示)
3. LifelogInput (入力フォーム)
4. LifelogCard (タイムライン項目)
5. LifelogTimeline (タイムライン)
6. CalendarView (カレンダー表示)
7. EventForm (イベント作成)
8. NaturalLanguageInput (自然言語入力)
9. MainDashboard (統合)
```

#### 2. 状態管理の拡張
```typescript
// 新しいContext
export interface CalendarContextType {
  events: CalendarEvent[];
  selectedDate: Date;
  view: 'month' | 'week' | 'day';
  fetchEvents: (start: Date, end: Date) => Promise<void>;
  createEvent: (event: Partial<CalendarEvent>) => Promise<void>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setView: (view: 'month' | 'week' | 'day') => void;
}

export interface LifelogContextType {
  entries: LifelogEntry[];
  loading: boolean;
  hasMore: boolean;
  fetchEntries: (offset?: number) => Promise<void>;
  createEntry: (entry: Partial<LifelogEntry>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<LifelogEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  searchEntries: (query: string) => Promise<void>;
}
```

### テスト戦略

#### 1. コンポーネントテスト
```typescript
// 各主要コンポーネントのテスト
describe('TodayTasksPanel', () => {
  it('should display today\'s tasks with correct priority indicators');
  it('should handle task completion toggle');
  it('should show progress bar correctly');
});

describe('LifelogInput', () => {
  it('should handle text input with character limit');
  it('should extract hashtags automatically');
  it('should handle image uploads');
});

describe('CalendarView', () => {
  it('should display events correctly');
  it('should handle view switching');
  it('should support drag and drop');
});
```

#### 2. 統合テスト
```typescript
// E2E テストシナリオ
describe('Dashboard Integration', () => {
  it('should create task from natural language input');
  it('should create lifelog entry and see it in timeline');
  it('should sync calendar events with tasks');
  it('should work responsively on mobile devices');
});
```

### パフォーマンス最適化計画

#### 1. コード分割
```typescript
// 遅延読み込みの実装
const CalendarView = lazy(() => import('./components/calendar/CalendarView'));
const LifelogTimeline = lazy(() => import('./components/lifelog/LifelogTimeline'));
const NaturalLanguageInput = lazy(() => import('./components/calendar/NaturalLanguageInput'));
```

#### 2. データキャッシュ
```typescript
// React Query の設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5分
      cacheTime: 10 * 60 * 1000, // 10分
    },
  },
});
```

#### 3. 仮想化
```typescript
// 大量データの効率的表示
import { FixedSizeList as List } from 'react-window';

const VirtualizedLifelogTimeline = ({ entries }) => (
  <List
    height={600}
    itemCount={entries.length}
    itemSize={120}
    itemData={entries}
  >
    {LifelogItem}
  </List>
);
```

## 🚀 デプロイ計画

### 環境構成
```
Development → Staging → Production
localhost:3000 → staging.myjarvis.app → myjarvis.app
```

### CI/CD パイプライン
```yaml
# .github/workflows/frontend-deploy.yml
name: Frontend Deploy
on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: cd frontend && npm ci
      - name: Run tests
        run: cd frontend && npm test
      - name: Build
        run: cd frontend && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

## 📊 成功指標

### 技術指標
- **ページ読み込み速度**: < 3秒
- **First Contentful Paint**: < 1.5秒
- **Largest Contentful Paint**: < 2.5秒
- **テストカバレッジ**: > 80%
- **TypeScript エラー**: 0件
- **ESLint エラー**: 0件

### ユーザビリティ指標
- **タスク作成時間**: < 30秒
- **カレンダー表示速度**: < 1秒
- **ライフログ投稿時間**: < 15秒
- **モバイル利用率**: > 60%

## ⚠️ リスク管理

### 高リスク項目
1. **自然言語解析の精度**: AI APIの学習期間が必要
2. **音声認識の精度**: ブラウザ差異とノイズ対応
3. **リアルタイム同期**: WebSocket接続の安定性
4. **モバイルパフォーマンス**: 大量データ表示時の最適化

### 対応策
1. **段階的実装**: 簡単なパターンから開始
2. **フォールバック機能**: 音声入力失敗時のテキスト入力
3. **オフライン対応**: ServiceWorker によるキャッシュ
4. **仮想化**: react-window による効率的表示

---

この実装ロードマップに沿って、段階的に機能を構築していきます。各フェーズ完了時には必ずテストとレビューを実施し、品質を保証しながら進めていきます。