# ADR-003: データベーススキーマ設計

## ステータス
承認済み

## 日付
2025-09-27

## 決定者
myJarvis開発チーム

## コンテキスト

新機能（ライフログ、カレンダーイベント、自然言語解析ログ）に対応するため、既存のデータベーススキーマを拡張する必要がある。

## 検討した選択肢

### 選択肢1: NoSQL（MongoDB）への移行
- **利点**: スキーマレス、水平スケーリング
- **欠点**: 既存データ移行、関係性管理の複雑化

### 選択肢2: PostgreSQL + JSONB拡張
- **利点**: 既存システム活用、ACID準拠、柔軟性
- **欠点**: 学習コスト、複雑なクエリ

### 選択肢3: 関係型テーブル追加
- **利点**: シンプル、既存知識活用、パフォーマンス
- **欠点**: スキーマ変更の影響、将来の拡張性

## 決定

**選択肢3: 関係型テーブル追加** を採用する。

### 理由

1. **既存システム活用**: PostgreSQL + Prismaの継続利用
2. **シンプルさ**: 既存チームの知識で対応可能
3. **パフォーマンス**: インデックス最適化が容易

## スキーマ設計

### 新規テーブル

#### 1. ライフログエントリ
```sql
CREATE TABLE lifelog_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (length(content) <= 280),
  tags TEXT[] DEFAULT '{}',
  mood VARCHAR(20) CHECK (mood IN ('great', 'good', 'okay', 'bad', 'terrible')),
  images TEXT[] DEFAULT '{}',
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lifelog_entries_user_id ON lifelog_entries(user_id);
CREATE INDEX idx_lifelog_entries_created_at ON lifelog_entries(created_at DESC);
CREATE INDEX idx_lifelog_entries_tags ON lifelog_entries USING GIN(tags);
```

#### 2. カレンダーイベント
```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  color VARCHAR(7) DEFAULT '#1976D2',
  location VARCHAR(255),
  is_all_day BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- RRULE format
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_time_range ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_category ON calendar_events(category);
```

#### 3. 自然言語解析ログ
```sql
CREATE TABLE nl_parse_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  input_text TEXT NOT NULL,
  parsed_result JSONB,
  confidence_score DOUBLE PRECISION,
  user_accepted BOOLEAN,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT nl_parse_logs_confidence_score_range
    CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1))
);

CREATE INDEX idx_nl_parse_logs_user_id ON nl_parse_logs(user_id);
CREATE INDEX idx_nl_parse_logs_created_at ON nl_parse_logs(created_at);
```

### Prismaスキーマ更新

```prisma
model LifelogEntry {
  id           String   @id @default(cuid())
  userId       String
  content      String   @db.VarChar(280)
  tags         String[]
  mood         String?
  images       String[]
  locationLat  Float?
  locationLng  Float?
  locationName String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("lifelog_entries")
}

model CalendarEvent {
  id             String   @id @default(cuid())
  userId         String
  title          String   @db.VarChar(255)
  description    String?
  startTime      DateTime
  endTime        DateTime
  category       String?  @default("general") @db.VarChar(50)
  color          String?  @default("#1976D2") @db.VarChar(7)
  location       String?  @db.VarChar(255)
  isAllDay       Boolean  @default(false)
  recurrenceRule String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([startTime, endTime])
  @@index([category])
  @@map("calendar_events")
}

model NlParseLog {
  id              String   @id @default(cuid())
  userId          String
  inputText       String   @db.Text
  parsedResult    Json?
  confidenceScore Float?
  userAccepted    Boolean?
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("nl_parse_logs")
}

// 既存Userモデルに追加
model User {
  // 既存フィールド...
  lifelogEntries LifelogEntry[]
  calendarEvents CalendarEvent[]
  nlParseLogs    NlParseLog[]
}
```

## データ制約と検証

### 業務ルール
1. **ライフログ**: 280文字制限、必須コンテンツ
2. **カレンダー**: 終了時刻 > 開始時刻、色コード形式
3. **解析ログ**: 信頼度スコア 0-1範囲

### パフォーマンス最適化
1. **インデックス戦略**: ユーザID、時刻範囲、作成日時
2. **パーティショニング**: 将来的な日付ベースパーティション
3. **アーカイブ戦略**: 古いログデータの定期アーカイブ

## セキュリティ考慮事項

1. **カスケード削除**: ユーザー削除時の関連データ削除
2. **データ暗号化**: 機密性の高いフィールドの暗号化検討
3. **アクセス制御**: Row Level Security (RLS) の将来的導入

## 移行戦略

### Phase 1: スキーマ追加
```sql
-- 新規テーブル作成
-- インデックス作成
-- 制約追加
```

### Phase 2: Prismaマイグレーション
```bash
npx prisma db push
npx prisma generate
```

### Phase 3: シードデータ
```typescript
// 開発用サンプルデータの作成
// テスト用データセットの準備
```

## 監視・メンテナンス

1. **クエリパフォーマンス**: pg_stat_statements での監視
2. **インデックス使用率**: unused index の定期確認
3. **ストレージ使用量**: テーブルサイズの定期監視

## 将来の拡張計画

1. **全文検索**: PostgreSQL FTS または Elasticsearch
2. **地理情報**: PostGIS 拡張の検討
3. **時系列データ**: TimescaleDB 拡張の検討

---

このスキーマ設計により、新機能の要件を満たしつつ、既存システムとの整合性を保つ。
