# ADR-002: 状態管理戦略

## ステータス
承認済み

## 日付
2025-09-27

## 決定者
myJarvis開発チーム

## コンテキスト

統合ダッシュボードにおいて、4つの主要機能（タスク管理、カレンダー、ライフログ、自然言語入力）の状態を効率的に管理する必要がある。

## 検討した選択肢

### 選択肢1: Redux Toolkit
- **利点**: 標準的、デバッグツール充実、大規模対応
- **欠点**: 学習コスト、ボイラープレート

### 選択肢2: Zustand
- **利点**: 軽量、シンプル、TypeScript対応
- **欠点**: エコシステム小、デバッグツール限定

### 選択肢3: React Context API + React Query
- **利点**: React標準、学習コスト低、サーバー状態分離
- **欠点**: Context地獄、パフォーマンス課題

## 決定

**選択肢3: React Context API + React Query** を採用する。

### 理由

1. **シンプルさ**: React標準APIで学習コストが低い
2. **適切な分離**: クライアント状態とサーバー状態の明確な分離
3. **段階的移行**: 必要に応じて他のライブラリへの移行が容易

## 実装戦略

### Context分割戦略
```typescript
// 機能別Context
AuthContext        - 認証状態
TaskContext        - タスク管理状態
CalendarContext    - カレンダー状態
LifelogContext     - ライフログ状態
ThemeContext       - UI設定
NotificationContext - 通知管理
```

### Provider階層
```typescript
function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <ThemeProvider theme={theme}>
          <AuthProvider>
            <NotificationProvider>
              <TaskProvider>
                <CalendarProvider>
                  <LifelogProvider>
                    {children}
                  </LifelogProvider>
                </CalendarProvider>
              </TaskProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
```

### React Query設定
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,    // 5分
      cacheTime: 10 * 60 * 1000,   // 10分
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        // Global error handling
      },
    },
  },
});
```

## パフォーマンス最適化

1. **Context分割**: 機能単位での再レンダリング防止
2. **Selector Pattern**: 必要なデータのみ取得
3. **memo化**: 適切なReact.memo使用
4. **遅延初期化**: useCallback, useMemoの活用

## 将来の移行計画

成長に応じた段階的移行：
```
Phase 1: Context API (現在)
  ↓ (複雑性が増した場合)
Phase 2: Zustand (軽量状態管理)
  ↓ (大規模化した場合)
Phase 3: Redux Toolkit (Enterprise対応)
```