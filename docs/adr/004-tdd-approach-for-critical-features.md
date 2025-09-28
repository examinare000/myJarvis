# ADR-004: Critical機能にTDDアプローチを採用する

## ステータス
承認済み (2025-09-28)

## コンテキスト
プロジェクトの重要機能（Critical Features）の品質を保証し、回帰バグを防ぐ必要があった。また、Agentによる自動開発においても、テストによる品質担保が重要であった。

## 決定
Critical機能の開発にTDD（Test-Driven Development）アプローチを採用する。

## 根拠
1. **品質保証**: テストファーストにより設計の妥当性を事前検証
2. **回帰防止**: 既存機能の破壊を早期発見
3. **ドキュメント**: テストが仕様書として機能
4. **リファクタリング**: 安全なコード改善が可能
5. **Agent開発**: 自動開発においてテストが品質の指針

## 実装戦略
### フェーズ1: Backend Models
```typescript
// backend/tests/models/lifelog.test.ts
describe('LifelogEntry Model', () => {
  it('should create entry with valid data', async () => {
    const entry = await prisma.lifelogEntry.create({
      data: {
        content: 'Test entry',
        userId: 'test-user',
        tags: ['test'],
        mood: 'good'
      }
    });
    expect(entry.content).toBe('Test entry');
  });

  it('should enforce 280 character limit', async () => {
    const longContent = 'a'.repeat(281);
    await expect(
      prisma.lifelogEntry.create({
        data: { content: longContent, userId: 'test-user' }
      })
    ).rejects.toThrow();
  });
});
```

### フェーズ2: API Endpoints
```typescript
// backend/tests/api/tasks.test.ts
describe('Tasks API', () => {
  it('GET /tasks/today should return today tasks', async () => {
    const response = await request(app)
      .get('/api/v1/tasks/today')
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('PUT /tasks/:id/status should update task status', async () => {
    const task = await createTestTask();
    const response = await request(app)
      .put(`/api/v1/tasks/${task.id}/status`)
      .send({ status: 'DONE' })
      .expect(200);

    expect(response.body.status).toBe('DONE');
  });
});
```

## 結果
### 実装済みテスト
- ✅ `LifelogEntry` モデルテスト (CRUD, バリデーション)
- ✅ `CalendarEvent` モデルテスト (時間範囲, 色形式)
- ✅ Tasks API テスト (今日のタスク, ステータス更新, 統計)
- ✅ Lifelog API テスト (CRUD, 検索, バリデーション)

### カバレッジ
- モデル: 95%+
- API: 90%+
- ビジネスロジック: 100%

### メリット
- バグ発見時間の短縮（開発時 vs 本番時）
- リファクタリングの安全性向上
- 新機能追加時の既存機能保護
- 仕様の明確化

### デメリット
- 初期開発時間の増加（約30%）
- テストメンテナンスのオーバーヘッド
- モックの複雑化

## テストランナー設定
```json
// backend/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## CI/CD統合
```bash
# package.json scripts
"test": "jest",
"test:watch": "jest --watch",
"test:coverage": "jest --coverage",
"test:ci": "jest --coverage --watchAll=false"
```

## 今後の展開
1. **Frontend Testing**: Vitest + Testing Library
2. **E2E Testing**: Playwright導入検討
3. **Visual Regression**: Chromatic導入検討
4. **Performance Testing**: Lighthouse CI