# myJarvis データベース設計

## 概要

myJarvisアプリケーションのデータベース設計書です。SQLiteをベースとした軽量でプライバシー重視の設計を採用しています。

## Prismaスキーマ

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

// ユーザー情報
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  timezone    String   @default("Asia/Tokyo")
  preferences Json?    // ユーザー設定
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // リレーション
  tasks         Task[]
  events        Event[]
  notifications Notification[]
  integrations  Integration[]
  satisfactionLogs SatisfactionLog[]

  @@map("users")
}

// タスク
model Task {
  id          String    @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(PENDING)
  priority    Priority   @default(MEDIUM)
  urgency     Priority   @default(MEDIUM)

  // 時間関連
  estimatedMinutes Int?
  actualMinutes    Int?
  dueDate         DateTime?
  startDate       DateTime?
  completedAt     DateTime?

  // メタデータ
  tags        String[]  // JSON配列として保存
  category    String?
  sourceType  String?   // "manual", "google_tasks", "email", etc.
  sourceId    String?   // 外部サービスのID

  // AI関連
  aiGenerated Boolean   @default(false)
  parentTaskId String?  // 分解前の元タスク

  // 外部キー
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // リレーション
  parentTask  Task?     @relation("TaskHierarchy", fields: [parentTaskId], references: [id])
  subtasks    Task[]    @relation("TaskHierarchy")

  @@map("tasks")
}

// カレンダーイベント
model Event {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  allDay      Boolean  @default(false)
  location    String?

  // メタデータ
  sourceType  String?  // "manual", "google_calendar", etc.
  sourceId    String?  // 外部サービスのID
  eventType   String?  // "meeting", "personal", "break", etc.

  // 外部キー
  userId      String
  user        User     @relation(fields: [userId], references: [id])

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("events")
}

// 通知
model Notification {
  id          String           @id @default(cuid())
  title       String
  message     String
  type        NotificationType
  priority    Priority         @default(MEDIUM)

  // タイミング
  scheduledFor DateTime
  sentAt       DateTime?
  readAt       DateTime?

  // 関連データ
  relatedType  String?  // "task", "event", etc.
  relatedId    String?  // 関連オブジェクトのID

  // 外部キー
  userId       String
  user         User     @relation(fields: [userId], references: [id])

  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  @@map("notifications")
}

// 外部サービス連携
model Integration {
  id            String            @id @default(cuid())
  serviceType   IntegrationType
  serviceName   String

  // 認証情報（暗号化して保存）
  accessToken   String?
  refreshToken  String?
  tokenExpiry   DateTime?

  // 設定
  isActive      Boolean           @default(true)
  syncInterval  Int               @default(15) // 分単位
  lastSyncAt    DateTime?

  // メタデータ
  settings      Json?             // サービス固有の設定

  // 外部キー
  userId        String
  user          User              @relation(fields: [userId], references: [id])

  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  @@unique([userId, serviceType])
  @@map("integrations")
}

// 満足度ログ
model SatisfactionLog {
  id            String   @id @default(cuid())
  date          DateTime @db.date

  // 満足度スコア (1-10)
  overallScore       Int
  productivityScore  Int?
  stressScore        Int?
  energyScore        Int?

  // 活動データ
  totalTasksCompleted Int      @default(0)
  totalMinutesWorked  Int      @default(0)
  totalBreakMinutes   Int      @default(0)

  // メモ
  notes         String?

  // 外部キー
  userId        String
  user          User     @relation(fields: [userId], references: [id])

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, date])
  @@map("satisfaction_logs")
}

// ML学習データ
model MLTrainingData {
  id            String   @id @default(cuid())

  // 入力特徴量
  features      Json     // タスク特性、時間、コンテキストなど

  // 出力ラベル
  outcome       Json     // 完了時間、満足度、成功可否など

  // メタデータ
  modelVersion  String
  dataVersion   String   @default("1.0")

  createdAt     DateTime @default(now())

  @@map("ml_training_data")
}

// Enum定義
enum TaskStatus {
  PENDING     // 未着手
  IN_PROGRESS // 実行中
  COMPLETED   // 完了
  CANCELLED   // キャンセル
  DEFERRED    // 延期
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum NotificationType {
  TASK_REMINDER     // タスクリマインダー
  SCHEDULE_UPDATE   // スケジュール更新
  DAILY_SUMMARY     // 日次サマリー
  BREAK_SUGGESTION  // 休憩提案
  SYSTEM_ALERT      // システム通知
}

enum IntegrationType {
  GOOGLE_CALENDAR
  GOOGLE_TASKS
  GMAIL
  SLACK
  MICROSOFT_TODO
  OUTLOOK
  ASANA
  TRELLO
}
```

## テーブル設計の考慮事項

### データ型選択
- **ID**: `cuid()` - 衝突しにくい、ソート可能
- **JSON**: 柔軟なメタデータ格納
- **DateTime**: タイムゾーン対応
- **String[]**: タグなどの配列データ

### インデックス戦略
```sql
-- パフォーマンス向上のための推奨インデックス
CREATE INDEX idx_tasks_user_status ON tasks(userId, status);
CREATE INDEX idx_tasks_due_date ON tasks(dueDate);
CREATE INDEX idx_events_user_time ON events(userId, startTime);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduledFor);
```

### データ暗号化
機密データの暗号化対象:
- `Integration.accessToken`
- `Integration.refreshToken`
- ユーザー個人情報（必要に応じて）

## データフロー

### 1. タスク作成・更新
```
外部API → Integration → Task作成/更新 → AI分析 → 最適化
```

### 2. スケジューリング
```
Task + Event → ML処理 → 最適スケジュール → Notification作成
```

### 3. 学習データ収集
```
ユーザー行動 → SatisfactionLog + MLTrainingData → モデル改善
```

## マイグレーション戦略

### 初期マイグレーション
```bash
npx prisma migrate dev --name init
```

### バージョン管理
- 段階的なスキーマ変更
- バックアップ戦略
- ロールバック計画

## パフォーマンス考慮事項

### クエリ最適化
```typescript
// N+1問題の回避
const tasksWithUser = await prisma.task.findMany({
  include: {
    user: true,
    subtasks: true
  }
});

// ページネーション
const tasks = await prisma.task.findMany({
  skip: page * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
});
```

### データアーカイブ
- 古いログデータの定期アーカイブ
- パフォーマンス維持のためのデータ削除ポリシー

## セキュリティ考慮事項

### データ保護
- SQLiteファイルの適切な権限設定 (600)
- 機密データの暗号化
- SQL インジェクション対策（Prisma使用により自動対応）

### プライバシー
- ローカルファイル保存によるデータ主権確保
- 外部サービストークンの安全な管理
- GDPR準拠のデータ削除機能

## 運用・保守

### バックアップ戦略
```bash
# SQLiteファイルの定期バックアップ
cp dev.db backup/dev_$(date +%Y%m%d_%H%M%S).db
```

### メンテナンス
- VACUUMによるファイルサイズ最適化
- ANALYZE による統計情報更新
- 定期的なデータ整合性チェック

## 将来拡張への準備

### マルチテナント対応
- 現在はUser単位での分離
- 将来的な組織・チーム機能への拡張

### クラウド移行
- SQLite → PostgreSQL への移行パス
- 分散データベースへの対応

---

**作成日**: 2025-09-26
**更新日**: 2025-09-26
**バージョン**: 1.0
**レビュアー**: Claude Code