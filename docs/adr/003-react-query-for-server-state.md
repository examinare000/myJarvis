# ADR-003: サーバー状態管理にReact Queryを採用する

## ステータス
承認済み (2025-09-28)

## コンテキスト
APIデータのフェッチング、キャッシュ、同期を効率的に管理する必要があった。従来のfetch + useState/useEffectパターンでは、ローディング状態やエラーハンドリングのボイラープレートが多く、キャッシュ管理も手動で行う必要があった。

## 決定
サーバー状態管理にReact Query (@tanstack/react-query) を採用する。

## 根拠
1. **専門性**: サーバー状態管理に特化した設計
2. **キャッシュ戦略**: 自動的なキャッシュ管理とガベージコレクション
3. **楽観的更新**: UXを向上させる楽観的更新が簡単
4. **DevTools**: 強力な開発ツールによるデバッグ支援
5. **自動同期**: バックグラウンドでのデータ同期
6. **TypeScript対応**: 優れた型推論とジェネリクス対応

## 結果
### メリット
- APIの重複リクエストの自動排除
- 自動的なキャッシュ無効化と再フェッチ
- ローディング・エラー状態の自動管理
- オフライン対応の基盤
- パフォーマンス最適化

### デメリット
- ライブラリサイズの増加（~100KB）
- 学習コストの存在
- サーバー状態とクライアント状態の分離が必要

## 実装例
```typescript
// API Client
export const apiClient = {
  getTodayTasks: async (): Promise<Task[]> => {
    const response = await fetch('/api/v1/tasks/today');
    return response.json();
  },
};

// Component
const { data: tasks, isLoading, error } = useQuery<Task[], Error>({
  queryKey: ['todayTasks'],
  queryFn: apiClient.getTodayTasks,
  staleTime: 1000 * 60 * 5, // 5 minutes
});

// Mutation
const updateStatusMutation = useMutation<Task, Error, { taskId: string; status: string }>({
  mutationFn: ({ taskId, status }) => apiClient.updateTaskStatus(taskId, status),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todayTasks'] });
  },
});
```

## 設定
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

## 代替案
- **SWR**: 軽量だが機能が限定的
- **Apollo Client**: GraphQL専用で、REST APIには過剰
- **手動管理**: fetch + useState/useEffectだが、ボイラープレートが多い