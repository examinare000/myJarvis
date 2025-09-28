# Critical Implementation Plan - 最小限MVP実装計画

## 🎯 目標

2週間以内に最小限のダッシュボードを実装し、ポート8080でアクセス可能にする。

## 📅 実装スケジュール

### Day 1-2: 基盤セットアップ
- [ ] Prismaスキーマ更新とマイグレーション
- [ ] バックエンドAPI基本実装
- [ ] フロントエンドプロジェクト設定

### Day 3-5: コア機能実装
- [ ] 当日タスク表示機能
- [ ] ライフログ投稿・表示機能
- [ ] ダッシュボードレイアウト

### Day 6-7: 統合・最適化
- [ ] フロントエンドとバックエンドの統合
- [ ] レスポンシブ対応
- [ ] エラーハンドリング

## 📦 Critical実装タスク（優先度順）

### 1. データベース・バックエンド（Day 1）

#### タスク: DB-001 Prismaスキーマ更新
```bash
# 実行コマンド
cd backend
```

```prisma
// backend/prisma/schema.prisma に追加

model LifelogEntry {
  id           String   @id @default(cuid())
  userId       String
  content      String   @db.VarChar(280)
  tags         String[]
  mood         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("lifelog_entries")
}

model CalendarEvent {
  id             String   @id @default(cuid())
  userId         String
  title          String   @db.VarChar(255)
  description    String?
  startTime      DateTime
  endTime        DateTime
  category       String?  @default("general")
  color          String?  @default("#1976D2")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([startTime, endTime])
  @@map("calendar_events")
}
```

```bash
# マイグレーション実行
npx prisma migrate dev --name add_lifelog_and_calendar
npx prisma generate
```

#### タスク: BE-001 最小限API実装

```typescript
// backend/src/routes/lifelog.ts
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schema
const createLifelogSchema = z.object({
  content: z.string().min(1).max(280),
  tags: z.array(z.string()).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
});

// GET /api/v1/lifelog/entries
router.get('/entries', async (req, res) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const entries = await prisma.lifelogEntry.findMany({
      where: { userId: req.user?.id },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
});

// POST /api/v1/lifelog/entries
router.post('/entries', async (req, res) => {
  try {
    const data = createLifelogSchema.parse(req.body);

    const entry = await prisma.lifelogEntry.create({
      data: {
        ...data,
        userId: req.user?.id || 'test-user', // TODO: 認証実装後に修正
      },
    });

    res.status(201).json(entry);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.errors });
    } else {
      res.status(500).json({ error: 'Failed to create entry' });
    }
  }
});

export default router;
```

```typescript
// backend/src/routes/tasks.ts に追加
// GET /api/v1/tasks/today
router.get('/today', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user?.id || 'test-user',
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
});
```

### 2. フロントエンド基盤（Day 2）

#### タスク: FE-001 プロジェクト設定

```bash
cd frontend
npm install zustand @tanstack/react-query react-hook-form @hookform/resolvers zod
```

```typescript
// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,  // ポート8080で起動
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@hooks': resolve(__dirname, 'src/hooks'),
    }
  }
});
```

#### タスク: FE-002 状態管理セットアップ

```typescript
// frontend/src/stores/uiStore.ts
import { create } from 'zustand';

interface UIStore {
  selectedDate: Date;
  taskFilter: 'all' | 'today' | 'week';
  sidebarOpen: boolean;

  setSelectedDate: (date: Date) => void;
  setTaskFilter: (filter: 'all' | 'today' | 'week') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  selectedDate: new Date(),
  taskFilter: 'today',
  sidebarOpen: true,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setTaskFilter: (filter) => set({ taskFilter: filter }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
```

```typescript
// frontend/src/lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});
```

### 3. コアコンポーネント実装（Day 3-5）

#### タスク: DS-001 メインダッシュボード

```typescript
// frontend/src/pages/Dashboard.tsx
import React from 'react';
import { Grid, Container, Typography, Box } from '@mui/material';
import { TodayTasksPanel } from '@components/dashboard/TodayTasksPanel';
import { LifelogSection } from '@components/lifelog/LifelogSection';
import { useUIStore } from '@stores/uiStore';

export const Dashboard: React.FC = () => {
  const selectedDate = useUIStore((state) => state.selectedDate);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1">
          myJarvis Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {selectedDate.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 当日タスク */}
        <Grid item xs={12} md={6} lg={4}>
          <TodayTasksPanel />
        </Grid>

        {/* ライフログ */}
        <Grid item xs={12} md={6} lg={8}>
          <LifelogSection />
        </Grid>
      </Grid>
    </Container>
  );
};
```

#### タスク: DS-002 当日タスクパネル

```typescript
// frontend/src/components/dashboard/TodayTasksPanel.tsx
import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  List,
  LinearProgress,
  Typography,
  Box,
  Skeleton,
} from '@mui/material';
import { TaskQuickCard } from './TaskQuickCard';
import { useTodayTasks } from '@hooks/queries/useTasks';

export const TodayTasksPanel: React.FC = () => {
  const { data: tasks, isLoading } = useTodayTasks();

  const completedCount = tasks?.filter(t => t.status === 'DONE').length || 0;
  const totalCount = tasks?.length || 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader
        title="今日のタスク"
        subheader={
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              {completedCount}/{totalCount} 完了 ({Math.round(completionRate)}%)
            </Typography>
          </Box>
        }
      />
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
            <Skeleton variant="rectangular" height={60} />
          </>
        ) : (
          <List disablePadding>
            {tasks?.map(task => (
              <TaskQuickCard key={task.id} task={task} />
            ))}
            {tasks?.length === 0 && (
              <Typography variant="body2" color="text.secondary" align="center">
                今日のタスクはありません
              </Typography>
            )}
          </List>
        )}
      </CardContent>
    </Card>
  );
};
```

#### タスク: LF-001 ライフログ入力

```typescript
// frontend/src/components/lifelog/LifelogInput.tsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  Mood as MoodIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLifelog } from '@hooks/mutations/useLifelog';

const lifelogSchema = z.object({
  content: z.string().min(1, 'テキストを入力してください').max(280, '280文字以内で入力してください'),
  tags: z.array(z.string()).optional(),
  mood: z.enum(['great', 'good', 'okay', 'bad', 'terrible']).optional(),
});

type LifelogFormData = z.infer<typeof lifelogSchema>;

const moodEmojis = {
  great: '😄',
  good: '😊',
  okay: '😐',
  bad: '😔',
  terrible: '😢',
};

export const LifelogInput: React.FC = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const createLifelog = useCreateLifelog();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<LifelogFormData>({
    resolver: zodResolver(lifelogSchema),
  });

  const content = watch('content', '');

  const onSubmit = (data: LifelogFormData) => {
    // タグを自動抽出
    const tags = content.match(/#\w+/g)?.map(tag => tag.substring(1)) || [];

    createLifelog.mutate(
      {
        ...data,
        tags,
        mood: selectedMood as any,
      },
      {
        onSuccess: () => {
          reset();
          setSelectedMood(null);
        },
      }
    );
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <TextField
            {...register('content')}
            fullWidth
            multiline
            rows={3}
            placeholder="今何してる？"
            variant="outlined"
            error={!!errors.content}
            helperText={errors.content?.message || `${content.length}/280`}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {Object.entries(moodEmojis).map(([mood, emoji]) => (
                <IconButton
                  key={mood}
                  onClick={() => setSelectedMood(mood === selectedMood ? null : mood)}
                  sx={{
                    bgcolor: mood === selectedMood ? 'primary.light' : 'transparent',
                  }}
                >
                  <Typography fontSize={20}>{emoji}</Typography>
                </IconButton>
              ))}
            </Box>

            <Button
              type="submit"
              variant="contained"
              endIcon={<SendIcon />}
              disabled={!content.trim() || createLifelog.isPending}
            >
              投稿
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
```

### 4. API Hooks実装（Day 4）

```typescript
// frontend/src/hooks/queries/useTasks.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const useTodayTasks = () => {
  return useQuery({
    queryKey: ['tasks', 'today'],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/tasks/today');
      return response.data;
    },
  });
};
```

```typescript
// frontend/src/hooks/queries/useLifelog.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const useLifelogEntries = () => {
  return useInfiniteQuery({
    queryKey: ['lifelog', 'entries'],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await apiClient.get('/api/v1/lifelog/entries', {
        params: { limit: 20, offset: pageParam },
      });
      return response.data;
    },
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined;
      return pages.length * 20;
    },
  });
};
```

```typescript
// frontend/src/hooks/mutations/useLifelog.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/apiClient';

export const useCreateLifelog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/api/v1/lifelog/entries', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lifelog', 'entries'] });
    },
  });
};
```

### 5. 統合・起動スクリプト（Day 5）

```json
// frontend/package.json
{
  "scripts": {
    "dev": "vite --port 8080",
    "build": "tsc && vite build",
    "preview": "vite preview --port 8080",
    "lint": "eslint src --ext ts,tsx",
    "type-check": "tsc --noEmit"
  }
}
```

```bash
# 起動スクリプト
# start.sh
#!/bin/bash

echo "🚀 Starting myJarvis Dashboard..."

# PostgreSQL起動
echo "Starting PostgreSQL..."
docker compose up -d postgres

# バックエンド起動
echo "Starting Backend..."
cd backend
npm run dev &
BACKEND_PID=$!

# フロントエンド起動（ポート8080）
echo "Starting Frontend on port 8080..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ myJarvis is running!"
echo "📱 Dashboard: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop all services..."

# 終了処理
trap "kill $BACKEND_PID $FRONTEND_PID; docker compose down" EXIT

wait
```

## 🚀 起動手順

```bash
# 1. データベースマイグレーション
cd backend
npx prisma migrate dev

# 2. 依存関係インストール
npm install
cd ../frontend
npm install

# 3. 起動
cd ..
chmod +x start.sh
./start.sh
```

## ✅ 完了基準

### Day 7終了時点で以下を達成:

1. **機能要件**
   - [ ] 当日タスクが表示される
   - [ ] タスクの完了/未完了が切り替えられる
   - [ ] ライフログが投稿できる
   - [ ] ライフログのタイムラインが表示される
   - [ ] レスポンシブ対応（モバイル/デスクトップ）

2. **技術要件**
   - [ ] フロントエンドがポート8080で動作
   - [ ] バックエンドAPIと正常に通信
   - [ ] エラーハンドリング実装
   - [ ] 基本的なローディング表示

3. **パフォーマンス**
   - [ ] 初期読み込み3秒以内
   - [ ] API応答2秒以内

## 📝 次のフェーズ

Critical実装完了後:
1. カレンダービュー追加（FullCalendar統合）
2. 自然言語入力機能
3. 詳細なフィルター・検索機能
4. AI統合機能

---

この計画に従って、最小限のMVPを7日間で実装し、ポート8080でアクセス可能なダッシュボードを構築する。