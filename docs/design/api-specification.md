# myJarvis API仕様書

## 概要

myJarvis Webアプリケーションの REST API 仕様書です。
OpenAPI 3.0準拠の形式で定義されています。

## ベースURL

```
開発環境: http://localhost:3001/api/v1
本番環境: https://myjarvis.local/api/v1  # ローカル環境想定
```

## 認証

### JWT認証
```http
Authorization: Bearer <JWT_TOKEN>
```

### 認証フロー
1. ログイン: `POST /auth/login`
2. JWTトークン受信
3. 以降のAPIリクエストにトークン添付
4. リフレッシュ: `POST /auth/refresh`

## 共通レスポンス形式

### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // レスポンスデータ
  },
  "message": "成功メッセージ",
  "timestamp": "2025-09-26T12:00:00Z"
}
```

### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": {
      // 詳細情報
    }
  },
  "timestamp": "2025-09-26T12:00:00Z"
}
```

## API エンドポイント

### 認証 (Authentication)

#### ログイン
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "山田太郎"
    }
  }
}
```

#### トークンリフレッシュ
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJ..."
}
```

### ユーザー (Users)

#### ユーザー情報取得
```http
GET /users/profile
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "山田太郎",
    "timezone": "Asia/Tokyo",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  }
}
```

#### ユーザー情報更新
```http
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "山田花子",
  "timezone": "Asia/Tokyo",
  "preferences": {
    "theme": "light"
  }
}
```

### タスク (Tasks)

#### タスク一覧取得
```http
GET /tasks?page=1&limit=20&status=PENDING&priority=HIGH
Authorization: Bearer <token>
```

**クエリパラメータ:**
- `page`: ページ番号 (default: 1)
- `limit`: 1ページあたりの件数 (default: 20, max: 100)
- `status`: タスクステータスフィルター
- `priority`: 優先度フィルター
- `category`: カテゴリフィルター
- `search`: 検索キーワード

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123",
        "title": "プレゼン資料作成",
        "description": "来週の会議用資料を作成する",
        "status": "PENDING",
        "priority": "HIGH",
        "urgency": "MEDIUM",
        "estimatedMinutes": 120,
        "dueDate": "2025-09-30T17:00:00Z",
        "tags": ["仕事", "プレゼン"],
        "category": "work",
        "createdAt": "2025-09-26T09:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

#### タスク作成
```http
POST /tasks
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "買い物リスト作成",
  "description": "週末の買い物リストをまとめる",
  "priority": "MEDIUM",
  "urgency": "LOW",
  "estimatedMinutes": 30,
  "dueDate": "2025-09-28T10:00:00Z",
  "tags": ["個人", "買い物"],
  "category": "personal"
}
```

#### タスク更新
```http
PUT /tasks/{taskId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "買い物リスト作成（更新）",
  "status": "IN_PROGRESS",
  "actualMinutes": 15
}
```

#### タスク削除
```http
DELETE /tasks/{taskId}
Authorization: Bearer <token>
```

#### タスク完了
```http
POST /tasks/{taskId}/complete
Authorization: Bearer <token>
Content-Type: application/json

{
  "actualMinutes": 25,
  "satisfactionScore": 8
}
```

### イベント (Events)

#### イベント一覧取得
```http
GET /events?start=2025-09-26&end=2025-09-30
Authorization: Bearer <token>
```

**クエリパラメータ:**
- `start`: 開始日 (YYYY-MM-DD)
- `end`: 終了日 (YYYY-MM-DD)
- `type`: イベントタイプフィルター

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "event_123",
        "title": "チーム会議",
        "description": "週次定例会議",
        "startTime": "2025-09-26T14:00:00Z",
        "endTime": "2025-09-26T15:00:00Z",
        "allDay": false,
        "location": "会議室A",
        "eventType": "meeting",
        "sourceType": "google_calendar"
      }
    ]
  }
}
```

### スケジューリング (Scheduling)

#### 最適スケジュール生成
```http
POST /scheduling/optimize
Authorization: Bearer <token>
Content-Type: application/json

{
  "targetDate": "2025-09-27",
  "preferences": {
    "workingHours": {
      "start": "09:00",
      "end": "18:00"
    },
    "breakPreference": {
      "frequency": 90,
      "duration": 15
    }
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "optimizedSchedule": [
      {
        "time": "09:00",
        "type": "task",
        "taskId": "task_123",
        "estimatedMinutes": 60,
        "priority": "HIGH"
      },
      {
        "time": "10:00",
        "type": "break",
        "duration": 15
      }
    ],
    "metrics": {
      "productivityScore": 8.5,
      "stressLevel": "medium",
      "workloadBalance": "optimal"
    }
  }
}
```

### 通知 (Notifications)

#### 通知一覧取得
```http
GET /notifications?unread=true
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123",
        "title": "タスクリマインダー",
        "message": "「プレゼン資料作成」の開始時間です",
        "type": "TASK_REMINDER",
        "priority": "HIGH",
        "scheduledFor": "2025-09-26T14:00:00Z",
        "readAt": null,
        "relatedType": "task",
        "relatedId": "task_123"
      }
    ]
  }
}
```

#### 通知既読マーク
```http
PUT /notifications/{notificationId}/read
Authorization: Bearer <token>
```

### 外部サービス連携 (Integrations)

#### 連携一覧取得
```http
GET /integrations
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "id": "integration_123",
        "serviceType": "GOOGLE_CALENDAR",
        "serviceName": "Google Calendar",
        "isActive": true,
        "lastSyncAt": "2025-09-26T12:00:00Z"
      }
    ]
  }
}
```

#### 外部サービス連携開始
```http
POST /integrations
Authorization: Bearer <token>
Content-Type: application/json

{
  "serviceType": "GOOGLE_CALENDAR",
  "authCode": "auth_code_from_oauth"
}
```

#### データ同期実行
```http
POST /integrations/{integrationId}/sync
Authorization: Bearer <token>
```

### AI・ML処理 (AI Processing)

#### タスク分解
```http
POST /ai/decompose-task
Authorization: Bearer <token>
Content-Type: application/json

{
  "originalTask": {
    "title": "旅行計画を立てる",
    "description": "来月の家族旅行の計画を立てる",
    "dueDate": "2025-10-15T10:00:00Z"
  }
}
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "decomposedTasks": [
      {
        "title": "旅行先の候補リストアップ",
        "estimatedMinutes": 30,
        "priority": "HIGH",
        "order": 1
      },
      {
        "title": "宿泊施設の予約",
        "estimatedMinutes": 45,
        "priority": "HIGH",
        "order": 2
      }
    ]
  }
}
```

### 分析・レポート (Analytics)

#### 生産性レポート
```http
GET /analytics/productivity?period=week&start=2025-09-20
Authorization: Bearer <token>
```

**レスポンス:**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "metrics": {
      "tasksCompleted": 15,
      "totalWorkMinutes": 2040,
      "averageSatisfaction": 7.8,
      "productivityTrend": "improving"
    },
    "dailyBreakdown": [
      {
        "date": "2025-09-20",
        "tasksCompleted": 3,
        "workMinutes": 480,
        "satisfactionScore": 8
      }
    ]
  }
}
```

## エラーコード一覧

| コード | HTTPステータス | 説明 |
|--------|----------------|------|
| `AUTH_REQUIRED` | 401 | 認証が必要です |
| `INVALID_TOKEN` | 401 | 無効なトークンです |
| `FORBIDDEN` | 403 | アクセス権限がありません |
| `NOT_FOUND` | 404 | リソースが見つかりません |
| `VALIDATION_ERROR` | 400 | 入力値に不正があります |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限を超過しました |
| `INTERNAL_ERROR` | 500 | 内部エラーが発生しました |

## レート制限

- **一般API**: 100リクエスト/分
- **AI処理API**: 10リクエスト/分
- **認証API**: 5リクエスト/分

## WebSocket API

### 接続
```javascript
const socket = new WebSocket('ws://localhost:3001/ws');

// 認証
socket.send(JSON.stringify({
  type: 'auth',
  token: 'jwt_token_here'
}));
```

### イベント

#### 通知受信
```json
{
  "type": "notification",
  "data": {
    "id": "notif_123",
    "title": "タスクリマインダー",
    "message": "開始時間です"
  }
}
```

#### タスク更新通知
```json
{
  "type": "task_update",
  "data": {
    "taskId": "task_123",
    "status": "COMPLETED"
  }
}
```

## 開発・テスト

### モックサーバー
```bash
npm run mock-server
```

### API テスト
```bash
npm run test:api
```

### Postmanコレクション
`docs/api/postman-collection.json` を参照

---

**作成日**: 2025-09-26
**更新日**: 2025-09-26
**バージョン**: 1.0
**レビュアー**: Claude Code