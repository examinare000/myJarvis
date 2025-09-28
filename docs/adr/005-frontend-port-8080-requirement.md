# ADR-005: Frontend を Port 8080 で動作させる

## ステータス
承認済み (2025-09-28)

## コンテキスト
プロジェクトの要件として、Frontend アプリケーションが Port 8080 で動作する必要があった。これは Critical Implementation Requirement として明示されていた。

## 決定
Frontend アプリケーションを Port 8080 で動作させる設定を実装する。

## 根拠
1. **要件準拠**: プロジェクトの Critical Implementation Requirement
2. **標準化**: 開発チーム間での統一されたアクセスポート
3. **本番環境対応**: デプロイ時のポート設定との一致
4. **プロキシ設定**: Backend (Port 3002) との明確な分離

## 実装
### Vite設定
```typescript
// frontend/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8080,  // Critical implementation requirement
    proxy: {
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
      }
    }
  },
  preview: {
    host: '0.0.0.0',
    port: 8080,
  },
});
```

### アクセスURL
- **Frontend**: http://localhost:8080/
- **API Proxy**: http://localhost:8080/api/v1/*
- **Backend Direct**: http://localhost:3002/api/v1/*

## 結果
### メリット
- 要件の完全準拠
- API プロキシによる CORS 問題の回避
- 開発環境での統一されたアクセス方法
- 本番環境との設定一致

### 考慮事項
- Port 8080 が他のサービスと競合しないことを確認
- Docker Compose使用時のポートマッピング設定
- 開発チームへの周知

## ポート設計
```
Frontend (React/Vite)    : 8080
Backend (Express)        : 3002
Database (PostgreSQL)    : 5432
AI Service (予定)        : 8000
```

## 検証
```bash
# Frontend アクセステスト
curl -I http://localhost:8080/

# API プロキシテスト
curl http://localhost:8080/api/v1/health

# Backend直接アクセステスト
curl http://localhost:3002/api/v1/health
```

## トラブルシューティング
### 問題: 404 エラー
- **原因**: index.html がルートディレクトリにない
- **解決**: `cp public/index.html index.html`

### 問題: TypeScript エラー
- **原因**: tsconfig.json未設定
- **解決**: 適切な TypeScript 設定ファイル作成

## 今後の対応
- Docker Compose での Port マッピング設定
- 本番環境でのリバースプロキシ設定
- Load Balancer での Port 8080 対応