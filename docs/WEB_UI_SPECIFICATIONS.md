# myJarvis Web UI 詳細仕様書

## 1. 概要

myJarvisのWebビューは、以下の4つの主要機能を統合したダッシュボードとして設計されます：

1. **標準カレンダービュー** - 従来のカレンダー表示機能
2. **自然言語カレンダー** - 音声・テキストによる自然な予定入力
3. **Twitter風ライフログ** - 簡単な日常記録機能
4. **当日タスク優先度表示** - 今日のタスクと重要度の可視化

## 2. メインダッシュボード設計

### 2.1 レイアウト構成
```
┌─────────────────────────────────────────────────────────────┐
│                     Header (myJarvis)                      │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │                 │ │                 │ │                 │ │
│ │  Today's Tasks  │ │ Calendar View   │ │ Natural Lang    │ │
│ │   & Priority    │ │  (Month/Week)   │ │ Calendar Input  │ │
│ │                 │ │                 │ │                 │ │
│ │                 │ │                 │ │                 │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                                                         │ │
│ │               Twitter-style Lifelog                    │ │
│ │          "What's happening in your life?"              │ │
│ │                                                         │ │
│ └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────┐ │
│ │                  Recent Lifelogs                       │ │
│ │                (Timeline View)                         │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 レスポンシブ対応
```
Desktop (1200px+):     3列レイアウト
Tablet (768px-1199px): 2列レイアウト
Mobile (〜767px):      1列縦スタック
```

## 3. 標準カレンダービュー

### 3.1 機能仕様
- **表示形式**: 月表示・週表示・日表示の切り替え
- **イベント表示**: 時間帯別の予定表示
- **ドラッグ&ドロップ**: 予定の移動・時間変更
- **色分け**: カテゴリ別の色コーディング
- **今日のハイライト**: 当日の強調表示

### 3.2 UI コンポーネント
```typescript
interface CalendarViewProps {
  view: 'month' | 'week' | 'day';
  selectedDate: Date;
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDateClick: (date: Date) => void;
  onEventDrop: (event: CalendarEvent, newDate: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  category: EventCategory;
  color: string;
  description?: string;
  location?: string;
  priority: 'high' | 'medium' | 'low';
}
```

### 3.3 ビジュアルデザイン
```css
.calendar-view {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  padding: 20px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
  background-color: #e0e0e0;
}

.calendar-day {
  background: white;
  min-height: 100px;
  padding: 8px;
  position: relative;
}

.calendar-day.today {
  background: linear-gradient(45deg, #e3f2fd, #bbdefb);
  border: 2px solid #2196f3;
}

.event-card {
  background: var(--event-color);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  margin: 2px 0;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.event-card:hover {
  transform: scale(1.05);
}
```

## 4. 自然言語カレンダー入力

### 4.1 機能仕様
- **テキスト入力**: "明日の午後2時に歯医者の予約"
- **音声入力**: ブラウザの Speech Recognition API
- **AI解析**: 自然言語を構造化データに変換
- **確認ダイアログ**: 解析結果の確認・修正
- **学習機能**: ユーザーの入力パターンを学習

### 4.2 対応パターン例
```
入力例 → 解析結果

"明日の3時に会議"
→ { date: tomorrow, time: "15:00", title: "会議" }

"来週の火曜日午前中に歯医者"
→ { date: next_tuesday, time: "10:00", title: "歯医者", duration: 120 }

"毎週金曜日の5時からヨガ"
→ { recurring: "weekly", day: "friday", time: "17:00", title: "ヨガ" }

"今度の土日は旅行"
→ { date: next_weekend, type: "multi-day", title: "旅行" }
```

### 4.3 UI実装
```typescript
interface NaturalLanguageInputProps {
  onEventCreate: (event: Partial<CalendarEvent>) => void;
  onVoiceInput?: (transcript: string) => void;
}

const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onEventCreate,
  onVoiceInput
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsedEvent, setParsedEvent] = useState<Partial<CalendarEvent> | null>(null);

  const handleParse = async (text: string) => {
    try {
      const response = await fetch('/api/v1/calendar/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const parsed = await response.json();
      setParsedEvent(parsed);
    } catch (error) {
      console.error('Failed to parse input:', error);
    }
  };

  return (
    <Card className="natural-input-card">
      <CardHeader title="Quick Event Entry" />
      <CardContent>
        <TextField
          fullWidth
          multiline
          placeholder="例: 明日の3時に歯医者の予約"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleParse(input)}
        />
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={() => handleParse(input)}
            disabled={!input.trim()}
          >
            Parse
          </Button>
          <Button
            variant={isListening ? "contained" : "outlined"}
            color={isListening ? "secondary" : "primary"}
            startIcon={<MicIcon />}
            onClick={toggleVoiceInput}
          >
            {isListening ? "Listening..." : "Voice"}
          </Button>
        </Box>

        {parsedEvent && (
          <EventConfirmationDialog
            event={parsedEvent}
            onConfirm={onEventCreate}
            onCancel={() => setParsedEvent(null)}
          />
        )}
      </CardContent>
    </Card>
  );
};
```

## 5. Twitter風ライフログ機能

### 5.1 機能仕様
- **簡単投稿**: 280文字以内の短文投稿
- **画像添付**: 写真・スクリーンショットの添付
- **タグ機能**: #work #personal #health などのタグ
- **位置情報**: オプションでGPS位置の記録
- **時系列表示**: 新しい投稿から順に表示
- **検索機能**: テキスト・タグ・日付での検索

### 5.2 データモデル
```typescript
interface LifelogEntry {
  id: string;
  userId: string;
  content: string;
  images?: string[];
  tags: string[];
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  createdAt: Date;
  updatedAt: Date;
}
```

### 5.3 UI実装
```typescript
const LifelogInput: React.FC = () => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [mood, setMood] = useState<string>('');
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  const handleSubmit = async () => {
    const entry: Partial<LifelogEntry> = {
      content,
      images: await uploadImages(images),
      tags: extractTags(content),
      mood: mood as any,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      } : undefined
    };

    await createLifelogEntry(entry);
    setContent('');
    setImages([]);
    setMood('');
  };

  return (
    <Card className="lifelog-input">
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          <Avatar src="/user-avatar.jpg" />
          <Box sx={{ flex: 1 }}>
            <TextField
              fullWidth
              multiline
              placeholder="What's happening in your life?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              variant="outlined"
              minRows={3}
              maxRows={6}
              helperText={`${content.length}/280`}
            />

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton component="label">
                  <PhotoIcon />
                  <input type="file" hidden multiple accept="image/*"
                         onChange={(e) => setImages(Array.from(e.target.files || []))} />
                </IconButton>
                <IconButton onClick={getLocation}>
                  <LocationIcon />
                </IconButton>
                <MoodSelector value={mood} onChange={setMood} />
              </Box>

              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={!content.trim() || content.length > 280}
                sx={{ borderRadius: '20px' }}
              >
                Post
              </Button>
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### 5.4 ライフログタイムライン
```typescript
const LifelogTimeline: React.FC = () => {
  const { data: entries, loading } = useLifelogEntries();

  return (
    <Box className="lifelog-timeline">
      {loading ? (
        <SkeletonLoader />
      ) : (
        entries.map(entry => (
          <LifelogCard key={entry.id} entry={entry} />
        ))
      )}
    </Box>
  );
};

const LifelogCard: React.FC<{ entry: LifelogEntry }> = ({ entry }) => {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Avatar src="/user-avatar.jpg" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" color="textSecondary" fontSize="0.9rem">
              {formatRelativeTime(entry.createdAt)}
              {entry.mood && <MoodIcon mood={entry.mood} />}
            </Typography>
            <Typography variant="body1" sx={{ mt: 1 }}>
              {entry.content}
            </Typography>

            {entry.tags.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {entry.tags.map(tag => (
                  <Chip key={tag} label={`#${tag}`} size="small" sx={{ mr: 0.5 }} />
                ))}
              </Box>
            )}

            {entry.images && entry.images.length > 0 && (
              <ImageGrid images={entry.images} />
            )}

            {entry.location && (
              <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="caption" color="textSecondary">
                  {entry.location.name || `${entry.location.latitude}, ${entry.location.longitude}`}
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
```

## 6. 当日タスク優先度表示

### 6.1 機能仕様
- **今日のタスク一覧**: 期限が今日のタスクを抽出
- **優先度ビジュアル**: 色・アイコンによる優先度表示
- **進捗状況**: 完了/未完了の状態表示
- **クイックアクション**: ワンクリックで完了マーク
- **時間見積もり**: 各タスクの所要時間表示
- **集中モード**: 重要タスクのハイライト

### 6.2 優先度システム
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: Date;
  estimatedMinutes?: number;
  category: TaskCategory;
  tags: string[];
}

enum TaskPriority {
  CRITICAL = 'critical',    // 🔴 緊急重要
  HIGH = 'high',           // 🟠 重要
  MEDIUM = 'medium',       // 🟡 普通
  LOW = 'low'              // 🟢 低
}

enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled'
}
```

### 6.3 UI実装
```typescript
const TodayTasksPanel: React.FC = () => {
  const { data: todayTasks } = useTodayTasks();
  const completedCount = todayTasks?.filter(t => t.status === TaskStatus.DONE).length || 0;
  const totalCount = todayTasks?.length || 0;
  const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card className="today-tasks-panel">
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TodayIcon color="primary" />
            <Typography variant="h6">Today's Tasks</Typography>
          </Box>
        }
        subheader={
          <Box sx={{ mt: 1 }}>
            <LinearProgress
              variant="determinate"
              value={completionRate}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="textSecondary">
              {completedCount}/{totalCount} completed ({Math.round(completionRate)}%)
            </Typography>
          </Box>
        }
      />
      <CardContent>
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {todayTasks?.map(task => (
            <TaskQuickCard key={task.id} task={task} />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
};

const TaskQuickCard: React.FC<{ task: Task }> = ({ task }) => {
  const [updateTask] = useUpdateTask();

  const handleToggleComplete = () => {
    updateTask({
      id: task.id,
      status: task.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE
    });
  };

  const getPriorityConfig = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.CRITICAL:
        return { color: '#f44336', icon: '🔴', label: 'Critical' };
      case TaskPriority.HIGH:
        return { color: '#ff9800', icon: '🟠', label: 'High' };
      case TaskPriority.MEDIUM:
        return { color: '#ffeb3b', icon: '🟡', label: 'Medium' };
      case TaskPriority.LOW:
        return { color: '#4caf50', icon: '🟢', label: 'Low' };
    }
  };

  const priorityConfig = getPriorityConfig(task.priority);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 1,
        bgcolor: task.status === TaskStatus.DONE ? 'grey.100' : 'background.paper',
        borderRadius: 2,
        border: `2px solid ${priorityConfig.color}`,
        opacity: task.status === TaskStatus.DONE ? 0.7 : 1,
        transition: 'all 0.2s'
      }}
    >
      <Checkbox
        checked={task.status === TaskStatus.DONE}
        onChange={handleToggleComplete}
        color="primary"
      />

      <Box sx={{ flex: 1 }}>
        <Typography
          variant="body1"
          sx={{
            textDecoration: task.status === TaskStatus.DONE ? 'line-through' : 'none',
            fontWeight: task.priority === TaskPriority.CRITICAL ? 'bold' : 'normal'
          }}
        >
          {task.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Chip
            label={`${priorityConfig.icon} ${priorityConfig.label}`}
            size="small"
            sx={{ bgcolor: priorityConfig.color, color: 'white', fontSize: '0.75rem' }}
          />

          {task.estimatedMinutes && (
            <Chip
              label={`${task.estimatedMinutes}min`}
              size="small"
              variant="outlined"
            />
          )}

          <Typography variant="caption" color="textSecondary">
            {task.category}
          </Typography>
        </Box>
      </Box>

      <IconButton
        size="small"
        onClick={() => {/* 詳細表示 */}}
      >
        <MoreVertIcon />
      </IconButton>
    </Box>
  );
};
```

## 7. 統合ダッシュボード実装

### 7.1 メインダッシュボードコンポーネント
```typescript
const MainDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: todayTasks } = useTodayTasks();
  const { data: events } = useCalendarEvents(selectedDate);

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Welcome back to myJarvis
      </Typography>

      <Grid container spacing={3}>
        {/* 今日のタスク */}
        <Grid item xs={12} md={4}>
          <TodayTasksPanel />
        </Grid>

        {/* カレンダービュー */}
        <Grid item xs={12} md={4}>
          <CalendarView
            view="month"
            selectedDate={selectedDate}
            events={events}
            onDateClick={setSelectedDate}
          />
        </Grid>

        {/* 自然言語入力 */}
        <Grid item xs={12} md={4}>
          <NaturalLanguageInput
            onEventCreate={handleEventCreate}
          />
        </Grid>

        {/* ライフログ入力 */}
        <Grid item xs={12}>
          <LifelogInput />
        </Grid>

        {/* ライフログタイムライン */}
        <Grid item xs={12}>
          <LifelogTimeline />
        </Grid>
      </Grid>
    </Container>
  );
};
```

### 7.2 レスポンシブ対応
```typescript
const useResponsiveLayout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const getGridLayout = () => {
    if (isMobile) {
      return {
        tasks: { xs: 12 },
        calendar: { xs: 12 },
        naturalInput: { xs: 12 },
        lifelog: { xs: 12 }
      };
    } else if (isTablet) {
      return {
        tasks: { xs: 12, md: 6 },
        calendar: { xs: 12, md: 6 },
        naturalInput: { xs: 12 },
        lifelog: { xs: 12 }
      };
    } else {
      return {
        tasks: { xs: 12, md: 4 },
        calendar: { xs: 12, md: 4 },
        naturalInput: { xs: 12, md: 4 },
        lifelog: { xs: 12 }
      };
    }
  };

  return { getGridLayout, isMobile, isTablet };
};
```

## 8. データフロー設計

### 8.1 API エンドポイント
```typescript
// Calendar API
GET    /api/v1/calendar/events?start=2024-01-01&end=2024-01-31
POST   /api/v1/calendar/events
PUT    /api/v1/calendar/events/:id
DELETE /api/v1/calendar/events/:id
POST   /api/v1/calendar/parse-natural-language

// Tasks API
GET    /api/v1/tasks/today
GET    /api/v1/tasks?date=2024-01-01
POST   /api/v1/tasks
PUT    /api/v1/tasks/:id
DELETE /api/v1/tasks/:id

// Lifelog API
GET    /api/v1/lifelog/entries?limit=20&offset=0
POST   /api/v1/lifelog/entries
PUT    /api/v1/lifelog/entries/:id
DELETE /api/v1/lifelog/entries/:id
POST   /api/v1/lifelog/upload-image
```

### 8.2 WebSocket イベント
```typescript
// Real-time updates
socket.on('task:updated', (task: Task) => {
  // Update task in cache
});

socket.on('event:created', (event: CalendarEvent) => {
  // Add event to calendar
});

socket.on('lifelog:new_entry', (entry: LifelogEntry) => {
  // Add to timeline
});
```

## 9. 実装フェーズ

### Phase 1: 基本機能 (2週間)
1. ✅ 今日のタスク表示
2. 🔄 標準カレンダービュー
3. 🔄 Twitter風ライフログ入力
4. 🔄 レスポンシブレイアウト

### Phase 2: 高度な機能 (3週間)
1. 自然言語カレンダー入力
2. 音声入力対応
3. 画像アップロード
4. 位置情報連携

### Phase 3: AI統合 (2週間)
1. AI による予定提案
2. タスク優先度の自動調整
3. ライフログからの洞察
4. パーソナライズ機能

## 10. パフォーマンス最適化

### 10.1 データ読み込み戦略
- **仮想化**: 大量のライフログエントリの効率的表示
- **遅延読み込み**: 画像の lazy loading
- **キャッシュ**: React Query による intelligent caching
- **プリロード**: 次月のカレンダーデータの先読み

### 10.2 レンダリング最適化
- **メモ化**: React.memo による再レンダリング防止
- **仮想スクロール**: 大量データの効率的表示
- **イメージ最適化**: WebP 対応と responsive images

---

この仕様書に基づいて、ユーザーが求める統合ダッシュボードを実装していきます。