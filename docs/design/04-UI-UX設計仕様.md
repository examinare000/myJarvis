# UI/UX設計仕様書

**バージョン:** 1.0
**日付:** 2025-09-25
**ステータス:** 初版
**作成者:** 開発チーム

## 1. 概要と目的

### 1.1 概要
本設計書は、myJarvis個人AIアシスタントのiOS・Web両プラットフォームにおけるUI/UX設計の詳細仕様を定義します。一貫したユーザー体験を提供しながら、各プラットフォームの特性を活かした最適化設計を行います。

### 1.2 設計原則
- **一貫性**: 両プラットフォーム間での統一されたブランドエクスペリエンス
- **直感性**: 学習コストを最小化した直感的な操作性
- **効率性**: タスク管理・スケジューリングの効率的なワークフロー
- **アクセシビリティ**: WCAG 2.1 AA準拠、多様なユーザーへの配慮
- **レスポンシブ**: マルチデバイス対応とリアルタイム同期反映

### 1.3 対象読者
- UI/UXデザイナー
- フロントエンド開発者（iOS・Web）
- プロダクトマネージャー
- QAエンジニア

## 2. デザインシステム

### 2.1 ブランドアイデンティティ

#### カラーパレット
```css
/* プライマリカラー */
--primary-50: #f0f9ff;
--primary-100: #e0f2fe;
--primary-500: #0ea5e9;  /* メインブランドカラー */
--primary-700: #0369a1;
--primary-900: #0c4a6e;

/* セカンダリカラー */
--secondary-50: #fef3c7;
--secondary-100: #fed7aa;
--secondary-500: #f59e0b;  /* アクセントカラー */
--secondary-700: #d97706;

/* グレースケール */
--gray-50: #f9fafb;
--gray-100: #f3f4f6;
--gray-200: #e5e7eb;
--gray-400: #9ca3af;
--gray-600: #4b5563;
--gray-800: #1f2937;
--gray-900: #111827;

/* ステータスカラー */
--success: #10b981;
--warning: #f59e0b;
--error: #ef4444;
--info: #3b82f6;

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
}
```

#### タイポグラフィ
```css
/* iOS - SF Pro Display/Text */
--font-family-ios: -apple-system, BlinkMacSystemFont, 'SF Pro Display';

/* Web - Inter + 游ゴシック */
--font-family-web: 'Inter', 'Yu Gothic Medium', 'Hiragino Sans', sans-serif;

/* フォントサイズ */
--text-xs: 12px;    /* キャプション */
--text-sm: 14px;    /* 本文小 */
--text-base: 16px;  /* 本文 */
--text-lg: 18px;    /* 小見出し */
--text-xl: 20px;    /* 見出し */
--text-2xl: 24px;   /* 大見出し */
--text-3xl: 30px;   /* タイトル */

/* 行間 */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

#### スペーシング
```css
/* 8pt grid system */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
```

### 2.2 コンポーネントライブラリ

#### ボタン
```swift
// iOS - SwiftUI
struct PrimaryButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(.white)
                .frame(maxWidth: .infinity, minHeight: 48)
                .background(Color.primary)
                .cornerRadius(12)
        }
    }
}
```

```typescript
// Web - React
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick: () => void;
}

const Button: React.FC<ButtonProps> = ({ variant, size, children, onClick }) => {
  const baseClasses = 'font-medium rounded-xl transition-colors focus:outline-none focus:ring-2';
  const variants = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
    ghost: 'hover:bg-gray-50 text-gray-700'
  };
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-base',
    lg: 'px-6 py-4 text-lg'
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

#### インプットフィールド
```swift
// iOS
struct TextInputField: View {
    @Binding var text: String
    let placeholder: String
    let isSecure: Bool

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
            }
        }
        .padding(.horizontal, 16)
        .frame(height: 48)
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.primary, lineWidth: text.isEmpty ? 0 : 1)
        )
    }
}
```

```typescript
// Web
interface InputFieldProps {
  label?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  error?: string;
}

const InputField: React.FC<InputFieldProps> = ({
  label, placeholder, value, onChange, type = 'text', error
}) => (
  <div className="space-y-1">
    {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 rounded-xl border border-gray-200
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
        ${error ? 'border-red-500' : ''}
      `}
    />
    {error && <p className="text-sm text-red-500">{error}</p>}
  </div>
);
```

## 3. 画面設計

### 3.1 情報アーキテクチャ

#### ナビゲーション構造
```
myJarvis App
├── Dashboard (ホーム)
│   ├── 今日のスケジュール
│   ├── 進行中のタスク
│   ├── 通知・アラート
│   └── クイックアクション
├── Tasks (タスク管理)
│   ├── タスク一覧
│   ├── タスク作成・編集
│   ├── タスク分解（LLM）
│   └── フィルター・検索
├── Schedule (スケジュール)
│   ├── カレンダービュー
│   ├── スケジュール最適化
│   ├── 時間ブロック管理
│   └── 満足度フィードバック
├── Insights (インサイト)
│   ├── 生産性ダッシュボード
│   ├── パターン分析
│   ├── 目標進捗
│   └── レポート
├── Integrations (連携)
│   ├── 外部サービス管理
│   ├── 同期設定
│   └── データエクスポート
└── Settings (設定)
    ├── アカウント管理
    ├── 通知設定
    ├── プライバシー設定
    └── アプリ情報
```

### 3.2 Dashboard (ホーム画面)

#### iOS レイアウト
```swift
struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 20) {
                // ヘッダー
                DashboardHeader(user: viewModel.user)

                // 今日のスケジュール
                TodayScheduleCard(schedule: viewModel.todaySchedule)

                // 進行中のタスク
                ActiveTasksCard(tasks: viewModel.activeTasks)

                // インサイト
                QuickInsightsCard(insights: viewModel.insights)

                // クイックアクション
                QuickActionBar()
            }
            .padding(.horizontal)
        }
        .refreshable {
            await viewModel.refresh()
        }
        .navigationTitle("myJarvis")
    }
}

struct DashboardHeader: View {
    let user: User

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("おはようございます")
                    .font(.subheadline)
                    .foregroundColor(.secondary)

                Text("\(user.name)さん")
                    .font(.title2)
                    .fontWeight(.semibold)
            }

            Spacer()

            // 同期状況
            SyncStatusIndicator(isConnected: viewModel.isConnected)
        }
    }
}
```

#### Web レイアウト
```typescript
const Dashboard: React.FC = () => {
  const { user, todaySchedule, activeTasks, insights, isLoading } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* ヘッダー */}
      <DashboardHeader user={user} />

      {/* メインコンテンツ */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左カラム - 今日のスケジュール */}
        <div className="lg:col-span-2 space-y-6">
          <TodayScheduleCard schedule={todaySchedule} />
          <ActiveTasksSection tasks={activeTasks} />
        </div>

        {/* 右カラム - インサイト・通知 */}
        <div className="space-y-6">
          <QuickInsightsCard insights={insights} />
          <NotificationCenter />
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

const DashboardHeader: React.FC<{ user: User }> = ({ user }) => (
  <div className="flex justify-between items-center">
    <div>
      <p className="text-sm text-gray-500">
        {getGreeting()} {/* おはようございます、こんにちは等 */}
      </p>
      <h1 className="text-2xl font-bold text-gray-900">
        {user.name}さん
      </h1>
    </div>

    <div className="flex items-center space-x-4">
      <SyncStatusBadge />
      <NotificationButton />
      <UserMenuDropdown user={user} />
    </div>
  </div>
);
```

### 3.3 Tasks (タスク管理)

#### タスク一覧画面
```swift
// iOS - タスクリスト
struct TaskListView: View {
    @StateObject private var viewModel = TaskListViewModel()
    @State private var showingTaskCreation = false

    var body: some View {
        NavigationView {
            List {
                // フィルター
                TaskFilterBar(
                    selectedFilter: $viewModel.activeFilter,
                    onFilterChange: viewModel.applyFilter
                )

                // タスク一覧
                ForEach(viewModel.filteredTasks) { task in
                    TaskRowView(
                        task: task,
                        onToggleComplete: viewModel.toggleTaskCompletion,
                        onDelete: viewModel.deleteTask
                    )
                    .swipeActions(edge: .trailing) {
                        Button("Delete", role: .destructive) {
                            viewModel.deleteTask(task)
                        }

                        Button("Edit") {
                            viewModel.editTask(task)
                        }
                        .tint(.blue)
                    }
                }
            }
            .searchable(text: $viewModel.searchText)
            .navigationTitle("Tasks")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showingTaskCreation = true }) {
                        Image(systemName: "plus")
                    }
                }
            }
            .sheet(isPresented: $showingTaskCreation) {
                TaskCreationView()
            }
        }
    }
}

struct TaskRowView: View {
    let task: Task
    let onToggleComplete: (Task) -> Void
    let onDelete: (Task) -> Void

    var body: some View {
        HStack(spacing: 12) {
            // 完了チェックボタン
            Button(action: { onToggleComplete(task) }) {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
                    .foregroundColor(task.isCompleted ? .green : .gray)
                    .font(.title2)
            }

            VStack(alignment: .leading, spacing: 4) {
                Text(task.title)
                    .font(.body)
                    .strikethrough(task.isCompleted)
                    .foregroundColor(task.isCompleted ? .secondary : .primary)

                if let dueDate = task.dueDate {
                    HStack {
                        Image(systemName: "clock")
                        Text(dueDate.formatted(.relative(presentation: .named)))
                    }
                    .font(.caption)
                    .foregroundColor(task.isOverdue ? .red : .secondary)
                }

                if !task.tags.isEmpty {
                    TagsView(tags: task.tags)
                }
            }

            Spacer()

            // 優先度インジケーター
            PriorityIndicator(priority: task.priority)
        }
        .padding(.vertical, 4)
    }
}
```

#### タスク作成・編集画面
```swift
struct TaskCreationView: View {
    @StateObject private var viewModel = TaskCreationViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            Form {
                Section("基本情報") {
                    TextField("タスクタイトル", text: $viewModel.title)
                    TextField("説明（任意）", text: $viewModel.description, axis: .vertical)
                        .lineLimit(3...6)
                }

                Section("設定") {
                    DatePicker("期限",
                              selection: $viewModel.dueDate,
                              displayedComponents: [.date, .hourAndMinute])

                    Picker("優先度", selection: $viewModel.priority) {
                        ForEach(Priority.allCases, id: \.self) { priority in
                            Text(priority.displayName).tag(priority)
                        }
                    }
                    .pickerStyle(.segmented)

                    TextField("推定時間（分）",
                             value: $viewModel.estimatedDuration,
                             format: .number)
                        .keyboardType(.numberPad)
                }

                Section("タグ") {
                    TagInputView(tags: $viewModel.tags)
                }

                // LLMタスク分解
                Section("AI支援") {
                    Button(action: viewModel.decomposeWithAI) {
                        HStack {
                            Image(systemName: "brain.head.profile")
                            Text("AIでタスクを分解")
                        }
                    }
                    .disabled(viewModel.title.isEmpty)

                    if viewModel.isDecomposing {
                        ProgressView("分解中...")
                    }

                    if !viewModel.suggestedSubtasks.isEmpty {
                        ForEach(viewModel.suggestedSubtasks) { subtask in
                            SubtaskSuggestionRow(
                                subtask: subtask,
                                isSelected: viewModel.selectedSubtasks.contains(subtask.id)
                            ) { isSelected in
                                viewModel.toggleSubtaskSelection(subtask.id, isSelected)
                            }
                        }
                    }
                }
            }
            .navigationTitle("新しいタスク")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("キャンセル") { dismiss() }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("作成") {
                        viewModel.createTask()
                        dismiss()
                    }
                    .disabled(!viewModel.isValid)
                }
            }
        }
    }
}
```

### 3.4 Schedule (スケジュール)

#### カレンダービュー
```typescript
// Web - スケジュール画面
const ScheduleView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  const { schedule, isOptimizing, optimizeSchedule } = useSchedule(currentDate);

  return (
    <div className="h-full flex flex-col">
      {/* ツールバー */}
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">スケジュール</h1>
          <DateNavigator
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        </div>

        <div className="flex items-center space-x-2">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <OptimizeButton
            onClick={optimizeSchedule}
            isLoading={isOptimizing}
          />
        </div>
      </div>

      {/* メインカレンダー */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'day' && <DayView date={currentDate} schedule={schedule} />}
        {viewMode === 'week' && <WeekView date={currentDate} schedule={schedule} />}
        {viewMode === 'month' && <MonthView date={currentDate} schedule={schedule} />}
      </div>

      {/* 最適化結果 */}
      {schedule.optimizationResult && (
        <OptimizationResultPanel result={schedule.optimizationResult} />
      )}
    </div>
  );
};

const WeekView: React.FC<{ date: Date; schedule: Schedule }> = ({ date, schedule }) => {
  const weekDays = getWeekDays(date);

  return (
    <div className="flex h-full">
      {/* 時間軸 */}
      <div className="w-16 flex-shrink-0 border-r">
        <div className="h-12 border-b" /> {/* ヘッダー空間 */}
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="h-12 border-b text-xs text-gray-500 px-2 py-1">
            {hour.toString().padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* 日別カラム */}
      <div className="flex-1 grid grid-cols-7">
        {weekDays.map(day => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            events={schedule.getEventsForDay(day)}
          />
        ))}
      </div>
    </div>
  );
};

const DayColumn: React.FC<{ date: Date; events: ScheduleEvent[] }> = ({ date, events }) => (
  <div className="border-r">
    {/* 日付ヘッダー */}
    <div className="h-12 border-b bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-xs text-gray-500">{date.toLocaleDateString('ja', { weekday: 'short' })}</div>
        <div className="text-sm font-medium">{date.getDate()}</div>
      </div>
    </div>

    {/* イベント表示エリア */}
    <div className="relative h-full">
      {events.map(event => (
        <ScheduleEventBlock
          key={event.id}
          event={event}
          onEdit={handleEventEdit}
          onDelete={handleEventDelete}
        />
      ))}
    </div>
  </div>
);
```

#### スケジュール最適化UI
```typescript
const OptimizationPanel: React.FC = () => {
  const [optimizationRequest, setOptimizationRequest] = useState<OptimizationRequest>({
    timeRange: { start: new Date(), end: addDays(new Date(), 7) },
    constraints: defaultConstraints,
    preferences: defaultPreferences
  });

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold mb-4">スケジュール最適化</h3>

      {/* 時間範囲設定 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          最適化期間
        </label>
        <DateRangePicker
          value={optimizationRequest.timeRange}
          onChange={range => setOptimizationRequest(prev => ({
            ...prev,
            timeRange: range
          }))}
        />
      </div>

      {/* 制約条件設定 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">作業時間</h4>
        <div className="space-y-3">
          {Object.entries(optimizationRequest.constraints.workHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">{day}</span>
              <div className="flex items-center space-x-2">
                <TimeInput
                  value={hours.start}
                  onChange={start => updateWorkHours(day, { start, end: hours.end })}
                />
                <span>-</span>
                <TimeInput
                  value={hours.end}
                  onChange={end => updateWorkHours(day, { start: hours.start, end })}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* エネルギーレベル設定 */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">エネルギーレベル</h4>
        <div className="space-y-2">
          <EnergyLevelSlider
            label="朝"
            value={optimizationRequest.preferences.energyLevels.morning}
            onChange={value => updateEnergyLevel('morning', value)}
          />
          <EnergyLevelSlider
            label="昼"
            value={optimizationRequest.preferences.energyLevels.afternoon}
            onChange={value => updateEnergyLevel('afternoon', value)}
          />
          <EnergyLevelSlider
            label="夜"
            value={optimizationRequest.preferences.energyLevels.evening}
            onChange={value => updateEnergyLevel('evening', value)}
          />
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={() => optimizeSchedule(optimizationRequest)}
        className="w-full"
      >
        スケジュールを最適化
      </Button>
    </div>
  );
};
```

### 3.5 設定画面

#### 通知設定
```swift
struct NotificationSettingsView: View {
    @StateObject private var viewModel = NotificationSettingsViewModel()

    var body: some View {
        Form {
            Section("プッシュ通知") {
                Toggle("プッシュ通知を有効にする", isOn: $viewModel.pushNotificationsEnabled)

                if viewModel.pushNotificationsEnabled {
                    Group {
                        Toggle("タスクリマインダー", isOn: $viewModel.taskReminders)
                        Toggle("スケジュール更新", isOn: $viewModel.scheduleUpdates)
                        Toggle("期限アラート", isOn: $viewModel.deadlineAlerts)
                    }
                    .padding(.leading, 20)
                }
            }

            Section("クワイエットタイム") {
                Toggle("クワイエットタイムを有効にする", isOn: $viewModel.quietHoursEnabled)

                if viewModel.quietHoursEnabled {
                    DatePicker("開始時刻",
                              selection: $viewModel.quietStartTime,
                              displayedComponents: .hourAndMinute)

                    DatePicker("終了時刻",
                              selection: $viewModel.quietEndTime,
                              displayedComponents: .hourAndMinute)
                }
            }

            Section("通知のトーン") {
                Picker("緊急度が高い場合", selection: $viewModel.highUrgencyTone) {
                    Text("フォーマル").tag("formal")
                    Text("フレンドリー").tag("friendly")
                    Text("カジュアル").tag("casual")
                }

                Picker("通常の場合", selection: $viewModel.mediumUrgencyTone) {
                    Text("フォーマル").tag("formal")
                    Text("フレンドリー").tag("friendly")
                    Text("カジュアル").tag("casual")
                }
            }
        }
        .navigationTitle("通知設定")
    }
}
```

## 4. レスポンシブデザイン

### 4.1 ブレークポイント
```css
/* Web - レスポンシブブレークポイント */
:root {
  /* モバイル */
  --breakpoint-sm: 640px;
  /* タブレット */
  --breakpoint-md: 768px;
  /* デスクトップ小 */
  --breakpoint-lg: 1024px;
  /* デスクトップ大 */
  --breakpoint-xl: 1280px;
  /* ワイドスクリーン */
  --breakpoint-2xl: 1536px;
}

/* レスポンシブグリッド */
.dashboard-grid {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .dashboard-grid {
    grid-template-columns: 2fr 1fr;
  }
}

@media (min-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr 2fr 1fr;
  }
}
```

### 4.2 モバイルファーストアプローチ
```typescript
// React - レスポンシブコンポーネント例
const ResponsiveDashboard: React.FC = () => {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  if (isMobile) {
    return <MobileDashboard />;
  }

  if (isTablet) {
    return <TabletDashboard />;
  }

  return <DesktopDashboard />;
};

// カスタムフック
const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('mobile');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) setBreakpoint('mobile');
      else if (width < 1024) setBreakpoint('tablet');
      else setBreakpoint('desktop');
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop'
  };
};
```

## 5. アクセシビリティ

### 5.1 WCAG 2.1 AA 準拠

#### カラーコントラスト
```css
/* 最小コントラスト比 4.5:1 を満たす設定 */
.text-primary-on-white {
  color: #0369a1; /* コントラスト比: 5.8:1 */
}

.text-secondary-on-white {
  color: #374151; /* コントラスト比: 8.6:1 */
}

/* ダークモード対応 */
@media (prefers-color-scheme: dark) {
  .text-primary-on-dark {
    color: #60a5fa; /* コントラスト比: 6.2:1 */
  }
}
```

#### フォーカス管理
```swift
// iOS - フォーカス管理
struct AccessibleButton: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
        }
        .accessibilityLabel(title)
        .accessibilityHint("タップして実行")
        .accessibilityAddTraits(.isButton)
    }
}

// React - フォーカストラップ
const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> =
({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // フォーカスを最初のフォーカス可能要素に移動
      const firstFocusable = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;
      firstFocusable?.focus();
    }
  }, [isOpen]);

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50"
      onKeyDown={e => e.key === 'Escape' && onClose()}
    >
      {children}
    </div>
  ) : null;
};
```

### 5.2 スクリーンリーダー対応

```swift
// iOS - VoiceOver対応
struct TaskRowView: View {
    let task: Task

    var body: some View {
        HStack {
            Text(task.title)
            Spacer()
            if task.isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .foregroundColor(.green)
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityLabel("\(task.title), \(task.isCompleted ? "完了" : "未完了")")
        .accessibilityHint(task.isCompleted ? "完了済みのタスク" : "未完了のタスク")
        .accessibilityAddTraits(task.isCompleted ? .isSelected : [])
    }
}
```

```typescript
// Web - ARIA属性
const TaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => (
  <div role="list" aria-label="タスク一覧">
    {tasks.map((task, index) => (
      <div
        key={task.id}
        role="listitem"
        aria-label={`${task.title}, ${task.isCompleted ? '完了' : '未完了'}`}
        aria-describedby={`task-${task.id}-details`}
        tabIndex={0}
      >
        <h3>{task.title}</h3>
        <div id={`task-${task.id}-details`} className="sr-only">
          期限: {task.dueDate?.toLocaleDateString('ja-JP')}
          優先度: {task.priority}
          状態: {task.isCompleted ? '完了' : '未完了'}
        </div>
      </div>
    ))}
  </div>
);
```

## 6. アニメーション・インタラクション

### 6.1 マイクロインタラクション

```swift
// iOS - アニメーション
struct AnimatedTaskCompletion: View {
    @State private var isCompleted = false
    @State private var scale: Double = 1.0

    var body: some View {
        Button(action: toggleCompletion) {
            Image(systemName: isCompleted ? "checkmark.circle.fill" : "circle")
                .scaleEffect(scale)
                .foregroundColor(isCompleted ? .green : .gray)
        }
        .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isCompleted)
        .animation(.easeInOut(duration: 0.1), value: scale)
    }

    private func toggleCompletion() {
        // タップフィードバック
        let impact = UIImpactFeedbackGenerator(style: .light)
        impact.impactOccurred()

        // アニメーション
        withAnimation {
            isCompleted.toggle()
        }

        // スケールエフェクト
        scale = 1.2
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
            scale = 1.0
        }
    }
}
```

```css
/* Web - CSS トランジション */
.task-item {
  transition: all 0.2s ease-in-out;
}

.task-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.task-completed {
  opacity: 0.6;
  transform: scale(0.98);
}

.task-completion-animation {
  animation: complete-bounce 0.6s ease-out;
}

@keyframes complete-bounce {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* ローディングアニメーション */
.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* スライドアニメーション */
.slide-enter {
  transform: translateX(100%);
  opacity: 0;
}

.slide-enter-active {
  transform: translateX(0);
  opacity: 1;
  transition: all 0.3s ease-in-out;
}
```

### 6.2 ページ遷移

```swift
// iOS - NavigationView遷移
struct ContentView: View {
    var body: some View {
        NavigationView {
            TabView {
                DashboardView()
                    .tabItem {
                        Image(systemName: "house")
                        Text("ホーム")
                    }

                TaskListView()
                    .tabItem {
                        Image(systemName: "checkmark.square")
                        Text("タスク")
                    }

                ScheduleView()
                    .tabItem {
                        Image(systemName: "calendar")
                        Text("スケジュール")
                    }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: selectedTab)
    }
}
```

```typescript
// Web - React Router遷移
const AppRouter: React.FC = () => (
  <Router>
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="container mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={
              <PageTransition>
                <Dashboard />
              </PageTransition>
            } />
            <Route path="/tasks" element={
              <PageTransition>
                <TaskList />
              </PageTransition>
            } />
            <Route path="/schedule" element={
              <PageTransition>
                <Schedule />
              </PageTransition>
            } />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  </Router>
);

const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ duration: 0.2 }}
  >
    {children}
  </motion.div>
);
```

## 7. テーマ・ダークモード対応

### 7.1 iOS ダークモード
```swift
// iOS - ダークモード対応
extension Color {
    static let primaryBackground = Color("PrimaryBackground") // Assets.xcassets で定義
    static let secondaryBackground = Color("SecondaryBackground")
    static let primaryText = Color("PrimaryText")
    static let secondaryText = Color("SecondaryText")
}

struct ThemedCard: View {
    var body: some View {
        VStack {
            // カードコンテンツ
        }
        .padding()
        .background(Color.secondaryBackground)
        .cornerRadius(12)
        .shadow(
            color: Color.black.opacity(colorScheme == .dark ? 0.3 : 0.1),
            radius: 8,
            x: 0,
            y: 2
        )
    }

    @Environment(\.colorScheme) var colorScheme
}
```

### 7.2 Web ダークモード
```css
/* CSS カスタムプロパティでテーマ管理 */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --text-primary: #111827;
  --text-secondary: #6b7280;
  --border-color: #e5e7eb;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #111827;
  --bg-secondary: #1f2937;
  --text-primary: #f9fafb;
  --text-secondary: #d1d5db;
  --border-color: #374151;
  --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* システム設定に従う場合 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #111827;
    --bg-secondary: #1f2937;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --border-color: #374151;
    --shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }
}

.card {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  box-shadow: var(--shadow);
}
```

```typescript
// React - テーマプロバイダー
const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    const applyTheme = (theme: string) => {
      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', systemTheme);
      } else {
        document.documentElement.setAttribute('data-theme', theme);
      }
    };

    applyTheme(theme);

    // システムテーマ変更の監視
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => theme === 'system' && applyTheme('system');
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

## 8. パフォーマンス最適化

### 8.1 リスト仮想化
```swift
// iOS - LazyVStack で大量データ対応
struct VirtualizedTaskList: View {
    let tasks: [Task]

    var body: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                ForEach(tasks) { task in
                    TaskRowView(task: task)
                        .onAppear {
                            // ページネーション
                            if task == tasks.last {
                                loadMoreTasks()
                            }
                        }
                }
            }
        }
    }
}
```

```typescript
// Web - React Virtual で仮想化
import { FixedSizeList as List } from 'react-window';

const VirtualizedTaskList: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

### 8.2 画像最適化
```swift
// iOS - AsyncImage with caching
struct OptimizedAsyncImage: View {
    let url: URL

    var body: some View {
        AsyncImage(url: url) { phase in
            switch phase {
            case .success(let image):
                image
                    .resizable()
                    .aspectRatio(contentMode: .fit)
            case .failure(_):
                Image(systemName: "photo")
                    .foregroundColor(.gray)
            case .empty:
                ProgressView()
            @unknown default:
                EmptyView()
            }
        }
        .frame(width: 100, height: 100)
    }
}
```

## 9. 実装考慮事項

### 9.1 開発ツールチェーン

**iOS:**
- Xcode 15+
- SwiftUI + Combine
- Swift Package Manager
- SwiftLint (コード品質)

**Web:**
- React 18+ with TypeScript
- Tailwind CSS (スタイリング)
- Framer Motion (アニメーション)
- ESLint + Prettier (コード品質)

### 9.2 テスト戦略

```swift
// iOS - UI テスト
class TaskListUITests: XCTestCase {
    func testTaskCreation() throws {
        let app = XCUIApplication()
        app.launch()

        // タスク作成画面に遷移
        app.navigationBars["Tasks"].buttons["Add"].tap()

        // タスクタイトル入力
        let titleField = app.textFields["タスクタイトル"]
        titleField.tap()
        titleField.typeText("テストタスク")

        // 作成ボタンタップ
        app.navigationBars.buttons["作成"].tap()

        // タスクが一覧に表示されることを確認
        XCTAssertTrue(app.staticTexts["テストタスク"].exists)
    }
}
```

```typescript
// Web - React Testing Library
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskList } from './TaskList';

describe('TaskList', () => {
  it('should render tasks correctly', () => {
    const mockTasks = [
      { id: '1', title: 'テストタスク1', isCompleted: false },
      { id: '2', title: 'テストタスク2', isCompleted: true }
    ];

    render(<TaskList tasks={mockTasks} />);

    expect(screen.getByText('テストタスク1')).toBeInTheDocument();
    expect(screen.getByText('テストタスク2')).toBeInTheDocument();
  });

  it('should handle task completion toggle', () => {
    const mockOnToggle = jest.fn();
    const mockTask = { id: '1', title: 'テストタスク', isCompleted: false };

    render(<TaskItem task={mockTask} onToggleComplete={mockOnToggle} />);

    fireEvent.click(screen.getByRole('button', { name: /complete/i }));

    expect(mockOnToggle).toHaveBeenCalledWith(mockTask);
  });
});
```

## 10. 関連文書

- [01-システムアーキテクチャ設計](/docs/design/01-システムアーキテクチャ設計.md)
- [02-API設計](/docs/design/02-API設計.md)
- [ADR-001: マルチプラットフォーム戦略](/docs/adr/ADR-001-マルチプラットフォーム戦略.md)
- [ADR-004: 通知システム設計](/docs/adr/ADR-004-通知システム設計.md)

---

*この設計書は、myJarvis システムのUI/UX設計の包括的な仕様を提供し、一貫性のあるユーザー体験と高い操作性を実現するための詳細なガイドラインを定義します。*