# Calendar Implementation Guide - @fullcalendar/react

## 実装ロードマップ

### Phase 2A: 基本実装 (2週間)

#### Day 1-3: 環境セットアップ
```bash
# 必要なパッケージのインストール
npm install @fullcalendar/react @fullcalendar/core
npm install @fullcalendar/daygrid @fullcalendar/timegrid
npm install @fullcalendar/interaction @fullcalendar/list
```

#### Day 4-7: 基本カレンダーコンポーネント
```typescript
// src/components/Calendar/CalendarView.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

export const CalendarView: React.FC = () => {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
      initialView="dayGridMonth"
      locale="ja"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
      }}
      height="auto"
      selectable={true}
      selectMirror={true}
      editable={true}
      droppable={true}
      dayMaxEvents={true}
    />
  );
};
```

#### Day 8-10: Material-UI統合
```typescript
// src/components/Calendar/StyledCalendar.tsx
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

export const CalendarContainer = styled('div')(({ theme }) => ({
  '& .fc': {
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.body2.fontSize,
  },
  '& .fc-toolbar': {
    marginBottom: theme.spacing(2),
  },
  '& .fc-button': {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    textTransform: 'none',
    fontWeight: theme.typography.button.fontWeight,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    },
    '&:focus': {
      boxShadow: `0 0 0 2px ${theme.palette.primary.main}25`,
    },
    '&.fc-button-active': {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    },
  },
  '& .fc-event': {
    borderRadius: theme.shape.borderRadius,
    border: 'none',
    fontSize: theme.typography.caption.fontSize,
    fontWeight: theme.typography.subtitle2.fontWeight,
  },
  '& .fc-daygrid-day': {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
  '& .fc-day-today': {
    backgroundColor: `${theme.palette.primary.main}08`,
    '& .fc-daygrid-day-number': {
      color: theme.palette.primary.main,
      fontWeight: theme.typography.subtitle1.fontWeight,
    },
  },
}));
```

#### Day 11-14: データ統合
```typescript
// src/hooks/useCalendarEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarEvent } from '@/types/calendar';

export const useCalendarEvents = (startDate: Date, endDate: Date) => {
  return useQuery({
    queryKey: ['calendar-events', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(
        `/api/v1/calendar/events?start=${startDate.toISOString()}&end=${endDate.toISOString()}`
      );
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5分
  });
};

export const useCreateEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Partial<CalendarEvent>) => {
      const response = await fetch('/api/v1/calendar/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};
```

### Phase 2B: 高度機能 (3週間)

#### Week 3: イベント操作
```typescript
// src/components/Calendar/EventHandlers.tsx
export const useCalendarHandlers = () => {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const title = prompt('イベントタイトルを入力してください:');
    if (title) {
      createEvent.mutate({
        title,
        startTime: selectInfo.start,
        endTime: selectInfo.end,
        isAllDay: selectInfo.allDay,
      });
    }
    selectInfo.view.calendar.unselect();
  }, [createEvent]);

  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    // イベント詳細ダイアログを開く
    openEventDialog(clickInfo.event.extendedProps);
  }, []);

  const handleEventDrop = useCallback((dropInfo: EventDropArg) => {
    updateEvent.mutate({
      id: dropInfo.event.id,
      startTime: dropInfo.event.start!,
      endTime: dropInfo.event.end!,
    });
  }, [updateEvent]);

  return {
    handleDateSelect,
    handleEventClick,
    handleEventDrop,
  };
};
```

#### Week 4: 自然言語入力統合
```typescript
// src/components/Calendar/NaturalLanguageInput.tsx
import { TextField, Button, Box, Card, CardContent } from '@mui/material';
import { useNaturalLanguageParser } from '@/hooks/useNaturalLanguageParser';

export const NaturalLanguageInput: React.FC = () => {
  const [input, setInput] = useState('');
  const { parseInput, parsedEvent, isLoading } = useNaturalLanguageParser();
  const createEvent = useCreateEvent();

  const handleSubmit = async () => {
    if (!input.trim()) return;

    const parsed = await parseInput(input);
    if (parsed) {
      createEvent.mutate(parsed);
      setInput('');
    }
  };

  return (
    <Card>
      <CardContent>
        <TextField
          fullWidth
          multiline
          placeholder="例: 明日の午後3時から1時間、歯医者の予約"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!input.trim() || isLoading}
          >
            予定を追加
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};
```

#### Week 5: モバイル最適化
```typescript
// src/components/Calendar/ResponsiveCalendar.tsx
import { useMediaQuery, useTheme } from '@mui/material';

export const ResponsiveCalendar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  const getCalendarConfig = () => {
    if (isMobile) {
      return {
        headerToolbar: {
          left: 'prev,next',
          center: 'title',
          right: 'listWeek'
        },
        initialView: 'listWeek',
        views: {
          listWeek: { buttonText: 'リスト' }
        }
      };
    } else if (isTablet) {
      return {
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek'
        },
        initialView: 'timeGridWeek'
      };
    } else {
      return {
        headerToolbar: {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        initialView: 'dayGridMonth'
      };
    }
  };

  return (
    <CalendarContainer>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        {...getCalendarConfig()}
        locale="ja"
        events={events}
        selectable={true}
        editable={!isMobile} // モバイルでは編集無効
        {...calendarHandlers}
      />
    </CalendarContainer>
  );
};
```

## 設定ファイル

### FullCalendar設定
```typescript
// src/config/calendarConfig.ts
export const CALENDAR_CONFIG = {
  locale: 'ja',
  firstDay: 0, // 日曜日開始
  timeZone: 'Asia/Tokyo',
  slotMinTime: '06:00:00',
  slotMaxTime: '24:00:00',
  slotDuration: '00:30:00',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  },
  dayHeaderFormat: {
    weekday: 'short',
    month: 'numeric',
    day: 'numeric'
  },
  businessHours: {
    daysOfWeek: [1, 2, 3, 4, 5], // 月-金
    startTime: '09:00',
    endTime: '18:00'
  }
};
```

### カテゴリー設定
```typescript
// src/config/eventCategories.ts
export const EVENT_CATEGORIES = {
  work: {
    label: '仕事',
    color: '#1976D2',
    textColor: '#FFFFFF'
  },
  personal: {
    label: '個人',
    color: '#388E3C',
    textColor: '#FFFFFF'
  },
  health: {
    label: '健康',
    color: '#F57C00',
    textColor: '#FFFFFF'
  },
  social: {
    label: '社交',
    color: '#7B1FA2',
    textColor: '#FFFFFF'
  },
  general: {
    label: '一般',
    color: '#455A64',
    textColor: '#FFFFFF'
  }
};
```

## パフォーマンス最適化

### 仮想化対応
```typescript
// src/hooks/useVirtualizedEvents.ts
export const useVirtualizedEvents = (allEvents: CalendarEvent[], viewRange: DateRange) => {
  return useMemo(() => {
    return allEvents.filter(event =>
      isWithinInterval(new Date(event.startTime), {
        start: viewRange.start,
        end: viewRange.end
      })
    );
  }, [allEvents, viewRange]);
};
```

### メモ化
```typescript
// src/components/Calendar/MemoizedCalendar.tsx
export const MemoizedCalendar = React.memo(FullCalendar, (prevProps, nextProps) => {
  return (
    prevProps.events === nextProps.events &&
    prevProps.locale === nextProps.locale &&
    prevProps.initialView === nextProps.initialView
  );
});
```

## テスト戦略

### 単体テスト
```typescript
// src/components/Calendar/__tests__/CalendarView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarView } from '../CalendarView';

describe('CalendarView', () => {
  it('renders calendar with events', () => {
    const mockEvents = [
      {
        id: '1',
        title: 'Test Event',
        startTime: new Date('2024-01-15T10:00:00'),
        endTime: new Date('2024-01-15T11:00:00'),
      }
    ];

    render(<CalendarView events={mockEvents} />);
    expect(screen.getByText('Test Event')).toBeInTheDocument();
  });

  it('handles date selection', () => {
    const mockOnDateSelect = jest.fn();
    render(<CalendarView onDateSelect={mockOnDateSelect} />);

    // カレンダーの日付をクリック
    fireEvent.click(screen.getByText('15'));
    expect(mockOnDateSelect).toHaveBeenCalled();
  });
});
```

### 統合テスト
```typescript
// src/components/Calendar/__tests__/CalendarIntegration.test.tsx
describe('Calendar Integration', () => {
  it('creates event through natural language input', async () => {
    render(<CalendarDashboard />);

    const input = screen.getByPlaceholderText('例: 明日の午後3時から1時間、歯医者の予約');
    fireEvent.change(input, { target: { value: '明日14時から会議' } });

    const submitButton = screen.getByText('予定を追加');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('会議')).toBeInTheDocument();
    });
  });
});
```

## トラブルシューティング

### よくある問題と解決策

#### 1. Material-UIテーマが適用されない
```typescript
// 解決策: ThemeProviderでラップ
import { ThemeProvider } from '@mui/material/styles';

<ThemeProvider theme={theme}>
  <CalendarContainer>
    <FullCalendar {...props} />
  </CalendarContainer>
</ThemeProvider>
```

#### 2. 日本語ローカライゼーションの問題
```typescript
// 解決策: ロケール設定を明示的に指定
import jaLocale from '@fullcalendar/core/locales/ja';

<FullCalendar
  locale={jaLocale}
  // または
  locale="ja"
/>
```

#### 3. バンドルサイズが大きい
```typescript
// 解決策: 必要なプラグインのみインポート
// ❌ 全プラグインをインポート
import '@fullcalendar/react/dist/vdom';

// ✅ 必要なプラグインのみ
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
```

この実装ガイドに従うことで、myJarvisプロジェクトに最適化されたカレンダー機能を効率的に実装できます。