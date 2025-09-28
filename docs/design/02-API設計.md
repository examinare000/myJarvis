# API設計書

**バージョン:** 1.0
**日付:** 2025-09-25
**ステータス:** 初版
**作成者:** 開発チーム

## 1. 概要と目的

### 1.1 概要
本設計書は、myJarvis BFF (Backend for Frontend) が提供するREST API および WebSocket API の詳細仕様を定義します。iOS・Web クライアントが安全かつ効率的にサーバーと通信するためのインターフェースを提供します。

### 1.2 設計原則
- **RESTful設計**: 統一されたリソース指向API
- **セキュリティファースト**: 認証・認可・暗号化の徹底
- **レスポンシブネス**: 高速なレスポンス時間
- **一貫性**: 統一されたレスポンス形式とエラーハンドリング
- **拡張性**: 新機能追加時の互換性維持

### 1.3 対象読者
- フロントエンド開発者（iOS・Web）
- バックエンド開発者
- APIテスト担当者
- システム統合担当者

## 2. API概要

### 2.1 ベース情報

```
Base URL: https://api.myjarvis.app/v1
WebSocket URL: wss://api.myjarvis.app/v1/ws

開発環境:
Base URL: https://dev-api.myjarvis.app/v1
WebSocket URL: wss://dev-api.myjarvis.app/v1/ws
```

### 2.2 認証方式

```http
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
X-Device-ID: <UNIQUE_DEVICE_ID>
X-Client-Version: <APP_VERSION>
```

### 2.3 共通レスポンス形式

**成功レスポンス**:
```json
{
  "success": true,
  "data": {
    // リソース固有のデータ
  },
  "meta": {
    "timestamp": "2025-09-25T10:00:00Z",
    "request_id": "req_123456789",
    "version": "1.0"
  }
}
```

**エラーレスポンス**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "リクエストデータが不正です",
    "details": [
      {
        "field": "title",
        "message": "タスクのタイトルは必須です"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-09-25T10:00:00Z",
    "request_id": "req_123456789"
  }
}
```

## 3. 認証・認可 API

### 3.1 ユーザー登録・ログイン

#### POST /auth/register

新規ユーザー登録

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!",
  "name": "田中太郎"
}
```

**レスポンス**:
```json
{
  "user": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "name": "田中太郎",
    "role": "USER",
    "createdAt": "2025-09-27T10:00:00.000Z"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "8b33fe...",
  "message": "User registered successfully"
}
```

#### POST /auth/login

既存ユーザーログイン

**リクエスト**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123!"
}
```

**レスポンス**:
```json
{
  "user": {
    "id": "usr_123456789",
    "email": "user@example.com",
    "name": "田中太郎",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "8b33fe...",
  "message": "Login successful"
}
```

#### POST /auth/refresh

トークンリフレッシュ

**リクエスト**:
```json
{
  "refresh_token": "rt_abcdef123456"
}
```

**レスポンス**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "9f8cd1...",
  "message": "Tokens refreshed successfully"
}
```

### 3.2 多要素認証

#### POST /auth/mfa/setup

MFA設定開始

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "qr_code": "data:image/png;base64,...",
    "secret": "ABCDEF123456",
    "backup_codes": ["12345678", "87654321", ...]
  }
}
```

#### POST /auth/mfa/verify

MFA認証

**リクエスト**:
```json
{
  "code": "123456",
  "backup_code": "optional_backup_code"
}
```

## 4. タスク管理 API

### 4.1 基本CRUD操作

#### GET /tasks

タスク一覧取得

**クエリパラメータ**:
- `status`: active, completed, archived
- `due_date`: YYYY-MM-DD (範囲指定可能)
- `limit`: 取得件数 (デフォルト: 50)
- `offset`: オフセット
- `sort`: created_at, due_date, priority

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "tasks": [
      {
        "id": "task_123456789",
        "title": "プロジェクト企画書作成",
        "description": "Q1の新プロジェクト企画書を作成する",
        "status": "active",
        "priority": "high",
        "due_date": "2025-10-01T09:00:00Z",
        "estimated_duration": 7200,
        "tags": ["work", "urgent"],
        "created_at": "2025-09-25T10:00:00Z",
        "updated_at": "2025-09-25T10:00:00Z",
        "version": 1
      }
    ],
    "pagination": {
      "total": 150,
      "limit": 50,
      "offset": 0,
      "has_more": true
    }
  }
}
```

#### POST /tasks

新規タスク作成

**リクエスト**:
```json
{
  "title": "プロジェクト企画書作成",
  "description": "Q1の新プロジェクト企画書を作成する",
  "priority": "high",
  "due_date": "2025-10-01T09:00:00Z",
  "estimated_duration": 7200,
  "tags": ["work", "urgent"],
  "external_references": [
    {
      "type": "google_calendar",
      "id": "calendar_event_id_123"
    }
  ]
}
```

**レスポンス**: タスクオブジェクト

#### GET /tasks/{task_id}

特定タスク取得

**レスポンス**: 単一タスクオブジェクト

#### PUT /tasks/{task_id}

タスク更新

**リクエスト**:
```json
{
  "title": "更新されたタスクタイトル",
  "status": "completed",
  "version": 2
}
```

**レスポンス**: 更新されたタスクオブジェクト

#### DELETE /tasks/{task_id}

タスク削除

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "deleted_task_id": "task_123456789",
    "deleted_at": "2025-09-25T10:00:00Z"
  }
}
```

### 4.2 LLMタスク分解

#### POST /tasks/{task_id}/decompose

LLMによるタスク分解

**リクエスト**:
```json
{
  "task_context": {
    "user_preferences": {
      "work_style": "detail_oriented",
      "time_blocks": ["morning", "afternoon"]
    },
    "related_projects": ["project_123"],
    "deadlines": ["2025-10-01T09:00:00Z"]
  },
  "decomposition_level": "detailed"
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "parent_task_id": "task_123456789",
    "subtasks": [
      {
        "id": "subtask_001",
        "title": "要件調査と分析",
        "description": "プロジェクトの要件を調査・整理する",
        "estimated_duration": 3600,
        "dependencies": [],
        "suggested_order": 1
      },
      {
        "id": "subtask_002",
        "title": "企画書骨子作成",
        "description": "企画書の構成を決めて骨子を作成",
        "estimated_duration": 1800,
        "dependencies": ["subtask_001"],
        "suggested_order": 2
      }
    ],
    "llm_metadata": {
      "model_version": "gemini-2.5-pro",
      "confidence_score": 0.87,
      "processing_time": 2.3
    }
  }
}
```

### 4.3 タスクバッチ操作

#### POST /tasks/batch

複数タスクの一括操作

**リクエスト**:
```json
{
  "operation": "update_status",
  "task_ids": ["task_001", "task_002", "task_003"],
  "data": {
    "status": "completed",
    "completed_at": "2025-09-25T10:00:00Z"
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "succeeded": ["task_001", "task_002"],
    "failed": [
      {
        "task_id": "task_003",
        "error": "Task not found"
      }
    ]
  }
}
```

## 5. スケジューリング API

### 5.1 スケジュール生成・最適化

#### POST /schedule/optimize

スケジュール最適化要求

**リクエスト**:
```json
{
  "time_range": {
    "start": "2025-09-25T09:00:00Z",
    "end": "2025-10-01T18:00:00Z"
  },
  "task_ids": ["task_001", "task_002", "task_003"],
  "constraints": {
    "work_hours": {
      "monday": {"start": "09:00", "end": "18:00"},
      "tuesday": {"start": "09:00", "end": "18:00"}
    },
    "break_preferences": {
      "min_break_duration": 15,
      "preferred_break_times": ["12:00", "15:00"]
    },
    "energy_levels": {
      "morning": 0.9,
      "afternoon": 0.7,
      "evening": 0.5
    }
  }
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "schedule_id": "schedule_123456",
    "optimized_schedule": [
      {
        "task_id": "task_001",
        "scheduled_start": "2025-09-25T09:00:00Z",
        "scheduled_end": "2025-09-25T11:00:00Z",
        "confidence_score": 0.92
      },
      {
        "type": "break",
        "scheduled_start": "2025-09-25T11:00:00Z",
        "scheduled_end": "2025-09-25T11:15:00Z"
      }
    ],
    "optimization_metadata": {
      "algorithm_version": "v2.1",
      "total_efficiency_score": 0.89,
      "estimated_completion_rate": 0.95
    }
  }
}
```

#### GET /schedule/{schedule_id}

スケジュール取得

#### POST /schedule/{schedule_id}/feedback

スケジュールフィードバック

**リクエスト**:
```json
{
  "task_id": "task_001",
  "feedback": {
    "satisfaction_score": 4.5,
    "actual_duration": 7800,
    "energy_level_after": 0.7,
    "notes": "予想より時間がかかったが、集中できた"
  }
}
```

## 6. 外部サービス統合 API

### 6.1 サービス認証

#### POST /integrations/{service}/auth

外部サービス認証開始

**パラメータ**:
- service: google, slack, microsoft

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "auth_url": "https://accounts.google.com/oauth/authorize?...",
    "state": "random_state_string",
    "expires_in": 600
  }
}
```

#### POST /integrations/{service}/callback

認証コールバック処理

**リクエスト**:
```json
{
  "code": "auth_code_from_provider",
  "state": "random_state_string"
}
```

#### GET /integrations

連携済みサービス一覧

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "integrations": [
      {
        "service": "google",
        "status": "active",
        "connected_at": "2025-09-01T10:00:00Z",
        "last_sync": "2025-09-25T09:00:00Z",
        "permissions": ["calendar.readonly", "gmail.readonly"]
      }
    ]
  }
}
```

### 6.2 データ同期

#### POST /integrations/{service}/sync

手動同期実行

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "sync_job_id": "sync_123456",
    "status": "in_progress",
    "estimated_completion": "2025-09-25T10:05:00Z"
  }
}
```

#### GET /integrations/sync/{sync_job_id}

同期ジョブ状態確認

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "job_id": "sync_123456",
    "status": "completed",
    "progress": 100,
    "results": {
      "calendar_events": 15,
      "emails": 32,
      "updated_tasks": 8
    },
    "completed_at": "2025-09-25T10:04:30Z"
  }
}
```

## 7. 通知 API

### 7.1 通知設定

#### GET /notifications/settings

通知設定取得

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "push_notifications": {
      "enabled": true,
      "task_reminders": true,
      "schedule_updates": true,
      "quiet_hours": {
        "start": "22:00",
        "end": "07:00"
      }
    },
    "notification_tone": {
      "urgency_high": "formal",
      "urgency_medium": "friendly",
      "urgency_low": "casual"
    }
  }
}
```

#### PUT /notifications/settings

通知設定更新

#### POST /notifications/register-device

デバイス登録（プッシュ通知用）

**リクエスト**:
```json
{
  "device_token": "device_push_token",
  "device_type": "ios|android|web",
  "app_version": "1.0.0"
}
```

### 7.2 通知履歴

#### GET /notifications/history

通知履歴取得

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_123456",
        "type": "task_reminder",
        "title": "タスクリマインダー",
        "message": "プロジェクト企画書の期限が近づいています",
        "sent_at": "2025-09-25T09:00:00Z",
        "opened_at": "2025-09-25T09:05:00Z",
        "status": "opened"
      }
    ]
  }
}
```

## 8. WebSocket API

### 8.1 接続・認証

#### 接続確立

```
wss://api.myjarvis.app/v1/ws?token=<JWT_TOKEN>
```

**接続後の認証メッセージ**:
```json
{
  "type": "auth",
  "data": {
    "device_id": "unique_device_id",
    "client_version": "1.0.0"
  }
}
```

**認証成功レスポンス**:
```json
{
  "type": "auth_success",
  "data": {
    "session_id": "ws_session_123456",
    "server_time": "2025-09-25T10:00:00Z"
  }
}
```

### 8.2 リアルタイム同期

#### データ更新通知

**サーバーからクライアント**:
```json
{
  "type": "data_update",
  "data": {
    "resource_type": "task",
    "operation": "update",
    "resource_id": "task_123456",
    "changes": {
      "status": "completed",
      "updated_at": "2025-09-25T10:00:00Z",
      "version": 3
    },
    "source_device": "other_device_id"
  }
}
```

#### データ同期要求

**クライアントからサーバー**:
```json
{
  "type": "sync_request",
  "data": {
    "resource_type": "task",
    "operation": "create",
    "resource_data": {
      "title": "新しいタスク",
      "due_date": "2025-10-01T09:00:00Z"
    },
    "local_id": "temp_123456"
  }
}
```

### 8.3 ハートビート・接続管理

#### Ping/Pong

**クライアント→サーバー**:
```json
{
  "type": "ping",
  "timestamp": "2025-09-25T10:00:00Z"
}
```

**サーバー→クライアント**:
```json
{
  "type": "pong",
  "timestamp": "2025-09-25T10:00:00Z",
  "server_time": "2025-09-25T10:00:00.123Z"
}
```

#### 接続エラー

```json
{
  "type": "error",
  "error": {
    "code": "AUTHENTICATION_EXPIRED",
    "message": "認証トークンの有効期限が切れています",
    "reconnect": true
  }
}
```

## 9. 自然言語解析ログ API

### 9.1 解析ログ登録

#### POST /nlp/parse-logs

自然言語入力から抽出した解析結果を永続化し、将来的な学習や監査に利用できるようにします。

**リクエスト**:
```json
{
  "userId": "usr_123456789",
  "inputText": "明日の15時に会議を入れて",
  "parsedResult": {
    "title": "会議",
    "startTime": "2025-09-28T15:00:00+09:00",
    "endTime": "2025-09-28T16:00:00+09:00"
  },
  "confidenceScore": 0.92,
  "userAccepted": true
}
```

**レスポンス**:
```json
{
  "success": true,
  "data": {
    "id": "npl_01HB9S6Z7S0R2X1Y2Z3W",
    "userId": "usr_123456789",
    "inputText": "明日の15時に会議を入れて",
    "parsedResult": {
      "title": "会議",
      "startTime": "2025-09-28T15:00:00+09:00",
      "endTime": "2025-09-28T16:00:00+09:00"
    },
    "confidenceScore": 0.92,
    "userAccepted": true,
    "createdAt": "2025-09-27T08:30:00Z"
  }
}
```

### 9.2 解析ログ取得

#### GET /nlp/parse-logs

ユーザー毎の解析ログを新しい順で取得します。`limit` を指定しない場合は 20 件、最大 100 件まで取得します。

**クエリパラメータ**:
- `userId` (必須) — ログを取得したいユーザーID
- `limit` (任意) — 1〜100 の整数

**レスポンス**:
```json
{
  "success": true,
  "data": [
    {
      "id": "npl_01HB9S6Z7S0R2X1Y2Z3W",
      "userId": "usr_123456789",
      "inputText": "明日の15時に会議を入れて",
      "parsedResult": {
        "title": "会議",
        "startTime": "2025-09-28T15:00:00+09:00",
        "endTime": "2025-09-28T16:00:00+09:00"
      },
      "confidenceScore": 0.92,
      "userAccepted": true,
      "createdAt": "2025-09-27T08:30:00Z"
    }
  ]
}
```

## 10. エラーハンドリング

### 9.1 HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 正常処理完了 |
| 201 | Created | リソース作成成功 |
| 400 | Bad Request | リクエスト形式エラー |
| 401 | Unauthorized | 認証エラー |
| 403 | Forbidden | 認可エラー |
| 404 | Not Found | リソース未存在 |
| 409 | Conflict | データ競合・バージョン不一致 |
| 429 | Too Many Requests | レート制限 |
| 500 | Internal Server Error | サーバー内部エラー |
| 503 | Service Unavailable | サービス一時利用不可 |

### 9.2 エラーコード

```typescript
enum ApiErrorCode {
  // 認証・認可
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // バリデーション
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // データ操作
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  VERSION_CONFLICT = 'VERSION_CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',

  // 外部サービス
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // システム
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}
```

## 11. レート制限

### 11.1 制限値

| エンドポイント | 制限 | ウィンドウ |
|---------------|------|-----------|
| /auth/* | 10 req/min | ユーザーごと |
| /tasks/* | 100 req/min | ユーザーごと |
| /schedule/* | 20 req/min | ユーザーごと |
| /integrations/*/sync | 5 req/min | ユーザーごと |
| LLM API | 10 req/hour | ユーザーごと |

### 11.2 レート制限ヘッダー

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1695639600
Retry-After: 60
```

## 12. バージョニング

### 12.1 APIバージョニング戦略

- **URL パス**: `/v1/`, `/v2/` でバージョン指定
- **後方互換性**: 最低2バージョンをサポート
- **廃止予告**: 3ヶ月前の事前通知
- **マイグレーション**: 段階的移行支援

### 12.2 変更管理

```http
API-Version: 1.0
API-Deprecated: false
API-Sunset-Date: 2026-09-25
```

## 13. セキュリティ

### 13.1 認証・認可

- **JWT**: RS256署名、1時間有効期限
- **リフレッシュトークン**: 30日有効期限、1回限り使用
- **MFA**: TOTP (RFC 6238) 対応
- **デバイス認証**: 証明書ベース認証

### 13.2 データ保護

- **HTTPS強制**: TLS 1.3, HSTS有効
- **CORS**: 厳格なオリジン制限
- **CSP**: Content Security Policy適用
- **入力サニタイズ**: 全入力データの検証・エスケープ

## 14. パフォーマンス

### 14.1 レスポンス時間目標

- **認証API**: < 200ms
- **CRUD操作**: < 300ms
- **LLMタスク分解**: < 5s
- **WebSocket**: < 100ms

### 14.2 最適化戦略

- **Redis キャッシング**: 頻繁アクセスデータ
- **データベース最適化**: インデックス・クエリ最適化
- **圧縮**: gzip/brotli レスポンス圧縮
- **CDN**: 静的リソース配信

## 15. 監視・ログ

### 15.1 メトリクス

```json
{
  "endpoint": "/tasks",
  "method": "GET",
  "response_time": 150,
  "status_code": 200,
  "user_id": "masked",
  "request_id": "req_123456"
}
```

### 15.2 ヘルスチェック

#### GET /health

**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2025-09-25T10:00:00Z",
  "version": "1.0.0",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "external_apis": "degraded"
  }
}
```

## 16. 実装考慮事項

### 16.1 開発環境

- **Swagger/OpenAPI**: API仕様書自動生成
- **Postman Collection**: テスト用API コレクション
- **モックサーバー**: フロントエンド開発支援

### 16.2 テスト戦略

- **単体テスト**: 各エンドポイントの機能テスト
- **統合テスト**: 外部サービス連携テスト
- **負荷テスト**: パフォーマンス・スケーラビリティテスト
- **セキュリティテスト**: 脆弱性診断

## 17. 関連文書

- [01-システムアーキテクチャ設計](/docs/design/01-システムアーキテクチャ設計.md)
- [ADR-002: 外部サービス統合戦略](/docs/adr/ADR-002-外部サービス統合戦略.md)
- [ADR-006: リアルタイム同期戦略](/docs/adr/ADR-006-リアルタイム同期戦略.md)

---

*この設計書は、myJarvis システムの包括的なAPI仕様を定義し、クライアント・サーバー間の効率的で安全な通信を実現するための詳細なガイドラインを提供します。*
