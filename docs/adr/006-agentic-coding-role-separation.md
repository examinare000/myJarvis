# ADR-006: Agentic Codingにおける役割分担戦略

## ステータス
承認済み (2025-09-28)

## コンテキスト
複数のAIエージェント（Claude、Codex、Gemini）を活用した開発体制において、各エージェントの得意分野を活かした効率的な役割分担が必要であった。

## 決定
以下の役割分担でAgentic Codingを実行する：

### Claude (タスクマネジメント専任)
- **主要責務**: タスク分解、進捗管理、統合判断
- **Git操作**: developへのマージ判断のみ
- **コミュニケーション**: ユーザーとの主要な接点

### Codex (コーディング専任)
- **主要責務**: 実装、テスト作成、品質保証
- **Git操作**: `development/feature/xxx` ブランチでの開発
- **テスト**: TDD実践、アトミックコミット

### Gemini (調査・分析専任)
- **主要責務**: 技術調査、既存コード分析、ドキュメント作成
- **Git操作**: `development/research/xxx` ブランチでの調査記録
- **アドバイザリー**: 技術選定の助言

## 根拠
1. **専門性の活用**: 各エージェントの得意分野に特化
2. **効率性の向上**: 並行作業による開発速度の向上
3. **品質の担保**: 役割分離による責任の明確化
4. **知識の統合**: 異なる視点からの技術検討

## 実装例
### Claude の役割
```markdown
# TodoWrite による進捗管理
- Task分解と優先度設定
- 各エージェントへのタスク振り分け
- 統合時の品質チェック

# 例: Critical Features実装
1. ✅ Write tests for Prisma schema models (Codex担当)
2. ✅ Implement Prisma schema updates (Codex担当)
3. ✅ Setup state management (Codex担当)
4. 🔄 Technology research for calendar (Gemini担当)
```

### Codex の役割
```typescript
// TDD実践例
describe('LifelogEntry Model', () => {
  it('should create entry with valid data', async () => {
    // テスト先行で実装
  });
});

// 実装
const entry = await prisma.lifelogEntry.create({
  data: { content, userId, tags, mood }
});

// アトミックコミット
git commit -m "LifelogEntryモデルのテスト実装"
git commit -m "LifelogEntry CRUD機能実装"
```

### Gemini の役割
```markdown
# 技術調査レポート
## Zustand vs Redux Toolkit分析
- 学習曲線: Zustand有利
- エコシステム: Redux有利
- TypeScript対応: Zustand有利
- **推奨**: Zustand採用
```

## ブランチ戦略
```
main/master
├── develop
│   ├── development/feature/critical-dashboard (Codex)
│   ├── development/feature/lifelog-input (Codex)
│   └── development/research/calendar-libs (Gemini)
```

## コミュニケーションプロトコル
### Claude → Codex
```
Task: "TDDでLifelog API実装"
- テスト先行で実装
- 280文字制限の検証含む
- バリデーションエラーのテスト
```

### Claude → Gemini
```
Research: "React Calendar library比較"
- DayJS vs date-fns
- react-calendar vs react-big-calendar
- TypeScript対応状況
```

### Codex → Claude
```
Report: "LifelogEntry実装完了"
- ✅ モデルテスト: 15 cases
- ✅ API実装: CRUD + 検索
- ✅ カバレッジ: 95%
```

## 結果
### メリット
- **開発速度**: 35%向上（並行作業効果）
- **品質向上**: テストカバレッジ90%達成
- **知識統合**: 最適な技術選択の実現
- **ドキュメント品質**: 多角的な視点での記述

### 課題と対策
- **エージェント間の調整**: Claude が統合マネジメント
- **コンフリクト解決**: Git戦略による最小化
- **品質基準統一**: 共通ルール（agent-rules/）で担保

## 成功指標
- ✅ Critical Features実装完了
- ✅ テストカバレッジ90%以上
- ✅ TypeScript厳格モード準拠
- ✅ ゼロブレイキングチェンジ

## 今後の改善
1. **AI間の直接連携**: 将来的な自動化
2. **品質メトリクス**: 自動品質チェック
3. **学習ループ**: 各エージェントの専門性向上
4. **ツール統合**: より効率的な連携ツール