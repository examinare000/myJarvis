# Calendar Libraries Analysis for myJarvis Phase 2

## 研究概要

myJarvisプロジェクトのPhase 2で実装予定のカレンダー機能に最適なReactライブラリを選定するため、5つの主要候補について詳細分析を実施しました。

**調査対象ライブラリ:**
1. react-big-calendar
2. react-calendar
3. @mui/x-date-pickers
4. react-datepicker
5. @fullcalendar/react

## プロジェクト環境との適合性

### 既存技術スタック
- **Frontend**: React 18 + TypeScript + Material-UI v5
- **State Management**: Zustand + React Query
- **Backend**: Express + Prisma + PostgreSQL
- **既存モデル**: CalendarEvent (schema.prisma で定義済み)

### CalendarEvent モデル詳細
```typescript
model CalendarEvent {
  id             String   @id @default(cuid())
  userId         String
  title          String   @db.VarChar(255)
  description    String?
  startTime      DateTime
  endTime        DateTime
  category       String?  @default("general") @db.VarChar(50)
  color          String?  @default("#1976D2") @db.VarChar(7)
  location       String?  @db.VarChar(255)
  isAllDay       Boolean  @default(false)
  recurrenceRule String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## 詳細比較表

| 項目 | react-big-calendar | react-calendar | @mui/x-date-pickers | react-datepicker | @fullcalendar/react |
|------|-------------------|----------------|-------------------|------------------|-------------------|
| **基本情報** | | | | | |
| 最新バージョン | v1.19.4 | v6.0.0 | v8.11.3 | v8.7.0 | v6.1.19 (v7.0.0 beta) |
| GitHub Stars | 8,500+ | 3,700+ | Material-UI組織 | 8,300+ | 20,000+ |
| 週間ダウンロード | ~483,243 | 不明 | ~2,300,000 | 不明 | ~2,000,000+ |
| ライセンス | MIT | MIT | MIT/Commercial | MIT | MIT |
| **技術的特徴** | | | | | |
| バンドルサイズ (min+gzip) | ~2.6MB (unpacked) | ~10kB | 76.9kB | ~2.85MB (unpacked) | ~43.1kB (core) |
| TypeScript対応 | 別途 @types/react-big-calendar | ネイティブ対応 | ネイティブ対応 | ネイティブ対応 | ネイティブ対応 |
| 依存関係 | prop-types + 日付ライブラリ | 最小限 | Material-UI v5+ | date-fns | モジュラー |
| Material-UI v5親和性 | 中程度 (カスタマイズ必要) | 低 (スタイリング必要) | 完全対応 | 中程度 | 中程度 |
| **機能比較** | | | | | |
| 月/週/日表示 | ✅ 全対応 | ❌ 月のみ | ❌ 日付選択のみ | ❌ 日付選択のみ | ✅ 全対応 + リスト |
| ドラッグ&ドロップ | ✅ | ❌ | ❌ | ❌ | ✅ (plugin) |
| イベント作成・編集 | ✅ | ❌ | ❌ | ❌ | ✅ |
| 日本語ローカライゼーション | ✅ 対応 | ✅ 対応 | ✅ 対応 | ✅ date-fns経由 | ✅ 対応 |
| モバイル対応 | ✅ | ✅ | ✅ | ✅ | ✅ (要調整) |
| アクセシビリティ | 基本対応 | 良好 | 優秀 | 優秀 | 良好 |
| **開発体験** | | | | | |
| ドキュメント品質 | 良好 | 良好 | 優秀 | 優秀 | 優秀 |
| サンプルコード | 豊富 | 基本的 | 豊富 | 豊富 | 豊富 |
| コミュニティサポート | Slack有り | 標準的 | Material-UI | 活発 | 活発 |
| 学習コスト | 中程度 | 低 | 低 (MUI使用時) | 低 | 中程度 |

## myJarvis固有要件への適合性

### 要件1: カレンダービュー機能
**WEB_UI_SPECIFICATIONS.md より抜粋:**
- 月表示・週表示・日表示の切り替え
- イベント表示と時間帯別予定表示
- ドラッグ&ドロップによる予定移動
- カテゴリ別色分け

**適合度ランキング:**
1. **@fullcalendar/react** - 完全対応、プラグインで拡張可能
2. **react-big-calendar** - 基本機能は対応、カスタマイズが必要
3. **@mui/x-date-pickers** - 日付選択のみ、カレンダービューなし
4. **react-calendar** - 月表示のみ、イベント表示機能なし
5. **react-datepicker** - 日付選択のみ

### 要件2: Zustand + React Query統合
```typescript
// 既存のstate管理パターンとの統合しやすさ
interface CalendarStore {
  events: CalendarEvent[];
  selectedDate: Date;
  view: 'month' | 'week' | 'day';
  // ...
}
```

**統合難易度:**
- **@fullcalendar/react**: 中程度 (イベントソース管理が必要)
- **react-big-calendar**: 低 (propsでイベント配列渡すだけ)
- **@mui/x-date-pickers**: 低 (単純な日付値管理)
- **react-calendar**: 低 (単純な日付値管理)
- **react-datepicker**: 低 (単純な日付値管理)

### 要件3: 将来のAI統合
Phase 3でのAI機能統合における拡張性:

**拡張性評価:**
1. **@fullcalendar/react** - プラグイン構造で柔軟
2. **react-big-calendar** - コンポーネント階層でカスタマイズ可能
3. **@mui/x-date-pickers** - Material-UIエコシステムで統合しやすい
4. **react-calendar** - 基本的な拡張のみ
5. **react-datepicker** - 基本的な拡張のみ

## 推奨順位と理由

### 🥇 1位: @fullcalendar/react
**スコア: 92/100**

**採用理由:**
- ✅ **完全なカレンダー機能**: 月/週/日/リスト表示すべて対応
- ✅ **ドラッグ&ドロップ**: 予定移動・リサイズが標準対応
- ✅ **豊富なプラグイン**: 必要な機能を選択的に導入可能
- ✅ **優秀なドキュメント**: 公式サイトが充実
- ✅ **大規模コミュニティ**: 20k+ stars、活発な開発
- ✅ **TypeScript完全対応**: 型安全性が高い

**懸念点:**
- ⚠️ Material-UI統合は手動カスタマイズが必要
- ⚠️ バンドルサイズがやや大きい (プラグイン選択で調整可能)

### 🥈 2位: react-big-calendar
**スコア: 78/100**

**採用理由:**
- ✅ **Reactネイティブ**: React専用設計で軽量
- ✅ **カレンダー表示**: 月/週/日表示対応
- ✅ **ドラッグ&ドロップ**: 基本的な操作対応
- ✅ **カスタマイズ性**: SASS による詳細スタイリング
- ✅ **React Query統合**: 簡単なprops渡しで済む

**懸念点:**
- ⚠️ Material-UI統合が中程度の工数
- ⚠️ TypeScript対応が別パッケージ
- ⚠️ 高度な機能は自前実装が必要

### 🥉 3位: @mui/x-date-pickers
**スコア: 65/100**

**採用理由:**
- ✅ **完璧なMaterial-UI統合**: 既存UIと完全に調和
- ✅ **優秀なUX**: Material Design ガイドライン準拠
- ✅ **TypeScript完全対応**: MUIエコシステムの一部
- ✅ **高品質**: 大規模ダウンロード数 (2.3M/week)

**懸念点:**
- ❌ **カレンダービューなし**: 日付選択特化、イベント表示不可
- ❌ **商用ライセンス**: 高度機能 (DateRangePicker等) は有料
- ❌ **myJarvis要件と不適合**: Phase 2の仕様を満たせない

### 4位: react-datepicker
**スコア: 45/100**

**採用理由:**
- ✅ **軽量**: シンプルな日付選択に特化
- ✅ **TypeScript対応**: ネイティブサポート
- ✅ **date-fns統合**: 既存の日付ライブラリと連携

**懸念点:**
- ❌ **カレンダービュー機能なし**: 日付選択のみ
- ❌ **イベント管理機能なし**: Phase 2要件と不適合

### 5位: react-calendar
**スコア: 40/100**

**採用理由:**
- ✅ **軽量**: 10kB gzippedで最小
- ✅ **TypeScript対応**: ネイティブサポート

**懸念点:**
- ❌ **月表示のみ**: 週/日表示なし
- ❌ **イベント機能なし**: 日付選択特化
- ❌ **Phase 2要件と大幅乖離**

## 実装方針

### 第1推奨: @fullcalendar/react 採用時

#### 必要パッケージ
```bash
npm install @fullcalendar/react @fullcalendar/core
npm install @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install @fullcalendar/list @fullcalendar/multimonth
```

#### 基本実装例
```typescript
// components/Calendar/FullCalendarView.tsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useCalendarStore } from '@/stores/calendarStore';

interface FullCalendarViewProps {
  events: CalendarEvent[];
  onEventClick: (info: any) => void;
  onDateSelect: (selectInfo: any) => void;
}

export const FullCalendarView: React.FC<FullCalendarViewProps> = ({
  events,
  onEventClick,
  onDateSelect
}) => {
  const { view, setView } = useCalendarStore();

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      }}
      initialView={view}
      locale='ja'
      events={events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.startTime,
        end: event.endTime,
        backgroundColor: event.color,
        extendedProps: {
          description: event.description,
          category: event.category,
          location: event.location
        }
      }))}
      selectable={true}
      selectMirror={true}
      dayMaxEvents={true}
      weekends={true}
      editable={true}
      droppable={true}
      eventClick={onEventClick}
      select={onDateSelect}
      viewDidMount={(info) => setView(info.view.type as any)}
    />
  );
};
```

#### Material-UI統合
```typescript
// styles/CalendarTheme.ts
import { styled } from '@mui/material/styles';

export const StyledCalendarContainer = styled('div')(({ theme }) => ({
  '& .fc': {
    fontFamily: theme.typography.fontFamily,
  },
  '& .fc-button-primary': {
    backgroundColor: theme.palette.primary.main,
    borderColor: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '& .fc-event': {
    borderRadius: theme.shape.borderRadius,
  },
  '& .fc-daygrid-day': {
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  },
}));
```

#### Zustand統合
```typescript
// stores/calendarStore.ts
import { create } from 'zustand';
import { CalendarEvent } from '@/types/calendar';

interface CalendarStore {
  events: CalendarEvent[];
  selectedDate: Date;
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';
  setEvents: (events: CalendarEvent[]) => void;
  setSelectedDate: (date: Date) => void;
  setView: (view: CalendarStore['view']) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  events: [],
  selectedDate: new Date(),
  view: 'dayGridMonth',
  setEvents: (events) => set({ events }),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setView: (view) => set({ view }),
}));
```

### 第2推奨: react-big-calendar 採用時

#### 必要パッケージ
```bash
npm install react-big-calendar @types/react-big-calendar
npm install date-fns  # または dayjs, moment
```

#### 基本実装例
```typescript
// components/Calendar/BigCalendarView.tsx
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { ja },
});

export const BigCalendarView: React.FC<BigCalendarViewProps> = ({
  events,
  onSelectEvent,
  onSelectSlot
}) => {
  return (
    <Calendar
      localizer={localizer}
      events={events.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.startTime),
        end: new Date(event.endTime),
        resource: event,
      }))}
      startAccessor="start"
      endAccessor="end"
      culture="ja"
      onSelectEvent={onSelectEvent}
      onSelectSlot={onSelectSlot}
      selectable
      resizable
      style={{ height: 600 }}
    />
  );
};
```

## 潜在的課題と対策

### @fullcalendar/react 選択時の課題

#### 課題1: Material-UI統合の複雑さ
**リスク**: デザインシステムの一貫性確保が困難
**対策**:
- CSS-in-JS (styled-components) でテーマ統合
- Material-UIのColorPaletteを使用したイベント色管理
- Typography設定の同期

#### 課題2: バンドルサイズの増大
**リスク**: 初期読み込み時間の増加
**対策**:
- 必要なプラグインのみ選択的導入
- Code splitting by route
- Dynamic import による遅延読み込み

#### 課題3: State管理の複雑化
**リスク**: FullCalendarの内部状態とZustandの同期問題
**対策**:
- EventSource approach でデータ整合性確保
- useEffect による双方向バインディング
- Optimistic updates の実装

### react-big-calendar 選択時の課題

#### 課題1: 高度機能の自前実装
**リスク**: 開発工数の増大
**対策**:
- MVP版は基本機能のみで開始
- 段階的機能追加によるリスク分散

#### 課題2: モバイル最適化
**リスク**: レスポンシブ対応の品質
**対策**:
- 画面サイズ別のビュー切り替え実装
- タッチイベントの最適化

## 推奨実装スケジュール

### Phase 2A: 基本カレンダー実装 (2週間)
**Week 1:**
- @fullcalendar/react基本セットアップ
- Material-UIテーマ統合
- 既存CalendarEventモデルとの連携

**Week 2:**
- CRUD操作の実装
- ドラッグ&ドロップ機能
- モバイル対応調整

### Phase 2B: 高度機能実装 (3週間)
**Week 3:**
- 自然言語入力パーサー連携
- カテゴリ別色分け
- 繰り返しイベント対応

**Week 4-5:**
- パフォーマンス最適化
- アクセシビリティ改善
- 統合テスト

## 最終推奨

**myJarvisプロジェクトには @fullcalendar/react を強く推奨します。**

**決定要因:**
1. **Phase 2要件との完全適合**: WEB_UI_SPECIFICATIONS.mdの全要件を満たす
2. **拡張性**: AI統合 (Phase 3) での柔軟な機能追加が可能
3. **品質**: 大規模プロジェクトでの実績とコミュニティサポート
4. **将来性**: アクティブな開発とエコシステム

**実装時の重点施策:**
- Material-UI統合の早期確立
- バンドルサイズ最適化
- 段階的機能追加によるリスク管理

この選択により、myJarvisの目指す「統合ダッシュボード」の核となる高品質なカレンダー機能を効率的に実装できると判断します。