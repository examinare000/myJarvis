# ADR-002: テスト戦略とTDD導入

## ステータス
承認済み

## コンテキスト
myJarvisプロジェクトにおいて、品質保証とメンテナビリティ向上のためのテスト戦略を策定する必要がある。t-wadaのTDD原則に従い、テストファーストアプローチを採用する。

## 決定事項

### 1. テスティングフレームワーク

| サービス | フレームワーク | 理由 |
|---------|--------------|------|
| Backend (Node.js) | Jest + Supertest | Express.jsとの高い親和性、豊富なマッチャー |
| Frontend (React) | Vitest + React Testing Library | Viteビルドツールとの統合、高速実行 |
| AI Service (Python) | pytest + httpx | Pythonエコシステムのスタンダード、非同期サポート |

### 2. TDD実装フェーズ

#### Red段階（完了）
- ✅ Backend: Jest設定、ヘルスチェック・認証テスト作成
- ✅ Frontend: Vitest設定、コンポーネントテスト作成
- ✅ AI Service: pytest設定、AI処理テスト作成

#### Green段階（次フェーズ）
- 各サービスで最小限の実装
- テストを通すことを最優先
- リファクタリングは後回し

#### Refactor段階
- コード品質改善
- 重複除去
- パフォーマンス最適化

### 3. テストレイヤー

```
┌─────────────────────────────────────┐
│          E2Eテスト (10%)            │  システム全体の動作確認
├─────────────────────────────────────┤
│       統合テスト (30%)              │  サービス間連携
├─────────────────────────────────────┤
│      ユニットテスト (60%)          │  個別機能の検証
└─────────────────────────────────────┘
```

### 4. カバレッジ目標
- ユニットテスト: 80%以上
- 統合テスト: 主要フロー100%
- E2Eテスト: クリティカルパス100%

## 結果

### 肯定的な結果
- 品質の早期保証
- リグレッション防止
- ドキュメントとしてのテスト
- リファクタリングの安全性向上

### 否定的な結果
- 初期開発速度の低下
- テストメンテナンスコスト
- モック作成の複雑性

## 現在の実装状況

### Backend (Node.js/Express)
```javascript
// テスト設定: jest.config.js
// テストファイル:
// - src/__tests__/health.test.ts (3テスト)
// - src/__tests__/auth.test.ts (8テスト)
// 状態: 0/11 passing (Red段階)
```

### Frontend (React/Vite)
```javascript
// テスト設定: vite.config.ts
// テストファイル:
// - src/__tests__/App.test.tsx (4テスト)
// - src/__tests__/components/TaskCard.test.tsx (8テスト)
// 状態: コンポーネント未実装によりエラー (Red段階)
```

### AI Service (Python/FastAPI)
```python
# テスト設定: pytest.ini
# テストファイル:
# - tests/test_health.py (3テスト)
# - tests/test_ai_processing.py (6テスト)
# 状態: 1/9 passing (Red段階)
```

## 次のアクション
1. Green段階：各サービスの最小実装
2. CI/CD統合：GitHub Actionsでテスト自動実行
3. カバレッジレポート設定
4. E2Eテストフレームワーク選定

## 更新履歴
- 2024-09-26: 初版作成、TDD Red段階完了