# Architecture Decision Records (ADR)

このディレクトリには、myJarvisプロジェクトで行われた重要な技術的決定の記録が含まれています。

## ADR一覧

| ID | タイトル | ステータス | 決定日 |
|----|----------|------------|--------|
| [001](./001-use-postgresql-instead-of-sqlite.md) | PostgreSQLをSQLiteの代わりに使用する | 承認済み | 2025-09-27 |
| [002](./002-zustand-for-state-management.md) | 状態管理にZustandを採用する | 承認済み | 2025-09-28 |
| [003](./003-react-query-for-server-state.md) | サーバー状態管理にReact Queryを採用する | 承認済み | 2025-09-28 |
| [004](./004-tdd-approach-for-critical-features.md) | Critical機能にTDDアプローチを採用する | 承認済み | 2025-09-28 |
| [005](./005-frontend-port-8080-requirement.md) | Frontend を Port 8080 で動作させる | 承認済み | 2025-09-28 |
| [006](./006-agentic-coding-role-separation.md) | Agentic Codingにおける役割分担戦略 | 承認済み | 2025-09-28 |

## ADRとは

Architecture Decision Record (ADR) は、ソフトウェア開発における重要な技術的決定を記録するドキュメントです。

### 目的
- 技術的決定の背景と根拠を明確にする
- 将来の開発者が決定の理由を理解できるようにする
- 決定の見直しや変更時の参考資料とする

### 構成
各ADRは以下の構成で記述されています：

1. **ステータス**: 提案中、承認済み、非推奨など
2. **コンテキスト**: 決定が必要になった背景
3. **決定**: 採用した解決策
4. **根拠**: なぜその決定を行ったか
5. **結果**: 決定による影響（メリット・デメリット）

## 分類

### インフラストラクチャ
- ADR-001: PostgreSQL採用

### フロントエンド
- ADR-002: Zustand採用
- ADR-003: React Query採用
- ADR-005: Port 8080要件

### 開発プロセス
- ADR-004: TDDアプローチ
- ADR-006: Agentic Coding戦略

## 現在のアーキテクチャ概要

```
┌─────────────────────┐    ┌─────────────────────┐
│   Frontend          │    │   Backend           │
│   (React/Vite)      │    │   (Express/Node.js) │
│   Port: 8080        │    │   Port: 3002        │
│                     │    │                     │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ React Components│ │    │ │ REST APIs       │ │
│ │ - Dashboard     │ │    │ │ - /tasks        │ │
│ │ - TasksPanel    │ │    │ │ - /lifelog      │ │
│ │ - LifelogInput  │ │    │ │ - /calendar     │ │
│ └─────────────────┘ │    │ └─────────────────┘ │
│ ┌─────────────────┐ │    │ ┌─────────────────┐ │
│ │ State Management│ │    │ │ WebSocket       │ │
│ │ - Zustand       │ │    │ │ - Socket.io     │ │
│ │ - React Query   │ │    │ │ - Real-time     │ │
│ └─────────────────┘ │    │ └─────────────────┘ │
└─────────────────────┘    └─────────────────────┘
           │                           │
           └───────API Proxy───────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │     Database                │
         │     PostgreSQL 16           │
         │     Port: 5432              │
         │                             │
         │ ┌─────────────────────────┐ │
         │ │ Tables                  │ │
         │ │ - User                  │ │
         │ │ - Task                  │ │
         │ │ - LifelogEntry          │ │
         │ │ - CalendarEvent         │ │
         │ └─────────────────────────┘ │
         └─────────────────────────────┘
```

## 重要な設計原則

### 1. TDDによる品質担保
Critical機能は全てテストファーストで実装し、回帰バグを防止します。

### 2. 段階的実装アプローチ
最小限の機能から開始し、継続的に機能を追加する戦略を採用しています。

### 3. Agent協働開発
Claude、Codex、Geminiの特性を活かした役割分担で効率的な開発を実現しています。

### 4. セキュリティバイデザイン
全ての決定において、セキュリティとプライバシーを最優先事項として考慮しています。

## 今後の予定

以下のトピックについてもADRを作成予定：

- [ ] 認証方式（JWT vs Session）
- [ ] AI統合戦略（Ollama vs OpenAI）
- [ ] カレンダーライブラリ選定
- [ ] デプロイ戦略（Docker vs Serverless）
- [ ] モニタリング・ログ戦略

## 参考資料

- [ADR GitHub Repository](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
- [Architecture Decision Records in Action](https://www.thoughtworks.com/radar/techniques/lightweight-architecture-decision-records)