# ADR-004: 技術スタック選定

## ステータス
承認済み

## 日付
2025-09-27

## 決定者
myJarvis開発チーム（Gemini MCP技術選定支援）

## コンテキスト

Critical実装（最小限のMVP）を素早く構築するため、適切な技術スタックを選定する必要がある。開発速度を最優先としつつ、将来の拡張性も考慮する。

## 決定した技術スタック

| カテゴリ | 選定技術 | 理由 |
|---------|---------|------|
| **状態管理** | **Zustand** | シンプルなAPI、学習コスト最小、ボイラープレート不要 |
| **UIコンポーネント** | **Material-UI v5** | 既存活用で学習コストゼロ、豊富なコンポーネント |
| **カレンダー** | **FullCalendar** | 機能網羅的、ドラッグ&ドロップ標準対応 |
| **データフェッチング** | **React Query (TanStack Query)** | サーバー状態の自動管理、キャッシング |
| **フォーム処理** | **React Hook Form** | 高パフォーマンス、少コード量 |
| **テスト** | **Vitest + React Testing Library** | Viteとシームレス統合、高速実行 |
| **開発環境** | **ESLint + Prettier + Husky** | 品質と一貫性の自動担保 |

## 実装アーキテクチャ

### 状態管理の分離戦略

```typescript
// Zustand: UIの状態管理（クライアント状態）
interface UIStore {
  // ダッシュボードUI状態
  sidebarOpen: boolean;
  selectedView: 'dashboard' | 'calendar' | 'lifelog';
  currentDate: Date;

  // アクション
  toggleSidebar: () => void;
  setView: (view: string) => void;
  setDate: (date: Date) => void;
}

// React Query: サーバー状態管理
const useTodayTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: fetchTodayTasks,
    staleTime: 5 * 60 * 1000, // 5分
  });
};
```

### コンポーネント構成

```
src/
├── stores/              # Zustand stores
│   ├── uiStore.ts     # UI状態
│   └── authStore.ts   # 認証状態
├── hooks/              # Custom hooks
│   ├── queries/       # React Query hooks
│   │   ├── useTasks.ts
│   │   ├── useCalendarEvents.ts
│   │   └── useLifelog.ts
│   └── mutations/     # React Query mutations
│       ├── useCreateTask.ts
│       └── useCreateLifelog.ts
├── components/         # UIコンポーネント
│   ├── dashboard/
│   │   ├── TodayTasksPanel.tsx
│   │   └── TaskQuickCard.tsx
│   ├── calendar/
│   │   └── CalendarView.tsx  # FullCalendar wrapper
│   └── lifelog/
│       ├── LifelogInput.tsx
│       └── LifelogTimeline.tsx
└── pages/
    └── Dashboard.tsx   # メインダッシュボード
```

## Critical実装の技術詳細

### 1. Zustand Store実装

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface DashboardStore {
  // State
  selectedDate: Date;
  taskFilter: 'all' | 'today' | 'week';
  lifelogLimit: number;

  // Actions
  setSelectedDate: (date: Date) => void;
  setTaskFilter: (filter: string) => void;
  loadMoreLifelogs: () => void;
}

export const useDashboardStore = create<DashboardStore>()(
  devtools((set) => ({
    selectedDate: new Date(),
    taskFilter: 'today',
    lifelogLimit: 20,

    setSelectedDate: (date) => set({ selectedDate: date }),
    setTaskFilter: (filter) => set({ taskFilter: filter as any }),
    loadMoreLifelogs: () => set((state) => ({
      lifelogLimit: state.lifelogLimit + 20
    })),
  }))
);
```

### 2. React Query設定

```typescript
// src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5分
      cacheTime: 10 * 60 * 1000,    // 10分
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        console.error('Mutation error:', error);
        // Toast notification
      },
    },
  },
});
```

### 3. FullCalendar統合

```typescript
// src/components/calendar/CalendarView.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

export const CalendarView: React.FC = () => {
  const { data: events } = useCalendarEvents();

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      events={events}
      editable={true}
      droppable={true}
      eventDrop={handleEventDrop}
      eventClick={handleEventClick}
    />
  );
};
```

### 4. React Hook Form実装

```typescript
// src/components/lifelog/LifelogInput.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const lifelogSchema = z.object({
  content: z.string().min(1).max(280),
  tags: z.array(z.string()).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
});

export const LifelogInput: React.FC = () => {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(lifelogSchema),
  });

  const createLifelog = useCreateLifelog();

  const onSubmit = (data: z.infer<typeof lifelogSchema>) => {
    createLifelog.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextField
        {...register('content')}
        multiline
        rows={3}
        error={!!errors.content}
        helperText={errors.content?.message}
      />
      <Button type="submit" disabled={createLifelog.isLoading}>
        Post
      </Button>
    </form>
  );
};
```

## 開発環境設定

### package.json依存関係追加

```json
{
  "dependencies": {
    "zustand": "^4.4.0",
    "@fullcalendar/react": "^6.1.0",
    "@fullcalendar/daygrid": "^6.1.0",
    "@fullcalendar/timegrid": "^6.1.0",
    "@fullcalendar/interaction": "^6.1.0",
    "@tanstack/react-query": "^5.0.0",
    "react-hook-form": "^7.45.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "husky": "^8.0.0",
    "lint-staged": "^15.0.0"
  }
}
```

### Vite設定更新（ポート8080）

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,  // フロントエンドを8080ポートで提供
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  }
});
```

## リスクと軽減策

### リスク
1. **Zustandの状態肥大化**: 複雑になった場合の管理困難
   - **軽減策**: ストアの分割、必要に応じてRedux Toolkitへ移行

2. **FullCalendarのカスタマイズ制限**: 特殊な要件への対応
   - **軽減策**: プラグイン拡張、必要に応じて部分的な自作実装

3. **React Queryの学習コスト**: チーム全体の習熟
   - **軽減策**: 共通フック作成、ベストプラクティス文書化

## 成功指標

- **開発速度**: Critical実装を2週間以内に完了
- **コード品質**: ESLint違反ゼロ、型エラーゼロ
- **パフォーマンス**: 初期読み込み3秒以内
- **保守性**: テストカバレッジ80%以上

---

この技術選定により、Critical実装を最速で進めつつ、将来の拡張性も確保する。