# ADR-002: 状態管理にZustandを採用する

## ステータス
承認済み (2025-09-28)

## コンテキスト
Reactアプリケーションの状態管理ライブラリを選定する必要があった。Redux、Context API、MobX、Zustandなどの選択肢を検討した。

## 決定
状態管理にZustandを採用する。

## 根拠
1. **シンプルさ**: ボイラープレートが最小限
2. **TypeScript親和性**: 型推論が優秀で型安全
3. **パフォーマンス**: 不要な再レンダリングを防ぐ設計
4. **学習曲線**: Reduxと比較して習得が容易
5. **Gemini MCP推奨**: 技術調査エージェントからの推奨

## 結果
### メリット
- コード量の削減（Reduxと比較して約70%削減）
- 開発速度の向上
- デバッグの容易さ
- React Hooks との自然な統合

### デメリット
- Redux DevToolsの限定的サポート
- エコシステムがReduxより小規模
- 大規模アプリでの実績が少ない

## 実装例
```typescript
// stores/useTaskStore.ts
import { create } from 'zustand';

export const useTaskStore = create<TaskState>((set) => ({
  todayTasks: [],
  taskStats: null,

  setTodayTasks: (tasks) => set({ todayTasks: tasks }),
  updateTaskInList: (taskId, updates) => set((state) => ({
    todayTasks: state.todayTasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  })),
}));
```

## 代替案
- **Redux Toolkit**: 成熟したエコシステムだが、ボイラープレートが多い
- **Context API + useReducer**: 追加ライブラリ不要だが、パフォーマンス課題あり
- **MobX**: 強力だが、学習曲線が急峻