# ADR-001: PostgreSQLをSQLiteの代わりに使用する

## ステータス
承認済み (2025-09-27)

## コンテキスト
当初、開発の簡易性を考慮してSQLiteを採用していたが、将来的なクラウド移行とスケーラビリティを考慮する必要が生じた。

## 決定
SQLiteからPostgreSQLに移行する。

## 根拠
1. **クラウド対応**: Heroku、AWS RDS、Google Cloud SQL等での運用が容易
2. **同時接続**: 複数ユーザーの同時アクセスに対応
3. **高度な機能**: JSON型、配列型、全文検索など豊富な機能
4. **本番環境との一致**: 開発環境と本番環境の差異を最小化
5. **Prismaサポート**: Prisma ORMとの親和性が高い

## 結果
### メリット
- スケーラブルなアーキテクチャ
- 豊富なデータ型のサポート
- トランザクション処理の改善
- レプリケーション対応

### デメリット
- 初期セットアップの複雑化
- Dockerが必須
- リソース消費の増加

## 実装
```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: myjarvis
      POSTGRES_PASSWORD: myjarvis_password
      POSTGRES_DB: myjarvis_db
    ports:
      - "5432:5432"
```