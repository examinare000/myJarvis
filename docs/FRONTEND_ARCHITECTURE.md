# myJarvis フロントエンド アーキテクチャ設計

## 1. アーキテクチャ概要

### 1.1 システム構成図
```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React/TypeScript)             │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │    Pages    │  │ Components  │  │   Hooks     │         │
│  │             │  │             │  │             │         │
│  │ Dashboard   │  │ TaskList    │  │ useAuth     │         │
│  │ Chat        │  │ MessageBubble│ │ useSocket   │         │
│  │ Login       │  │ TaskCard    │  │ useAPI      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Context    │  │  Services   │  │   Utils     │         │
│  │             │  │             │  │             │         │
│  │ AuthContext │  │ API Service │  │ formatDate  │         │
│  │ TaskContext │  │ Socket      │  │ validation  │         │
│  │ ChatContext │  │ Storage     │  │ constants   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                     External Libraries                     │
│  React Router │ Material-UI │ Socket.io-client │ Axios     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend Services                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  REST API    │  │  WebSocket   │  │  AI Service  │      │
│  │  Express.js  │  │  Socket.io   │  │  FastAPI     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 データフロー
```
User Interaction
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Pages    │────▶│ Components  │────▶│   Context   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Hooks     │◀────│  Services   │────▶│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│ Local State │     │ Local Cache │
└─────────────┘     └─────────────┘
```

## 2. フォルダ構成

### 2.1 現在の構成
```
frontend/
├── public/                    # 静的ファイル
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
├── src/
│   ├── components/           # 再利用可能なコンポーネント
│   │   ├── common/          # 共通コンポーネント
│   │   │   ├── Header/
│   │   │   ├── Sidebar/
│   │   │   ├── LoadingSpinner/
│   │   │   └── ErrorBoundary/
│   │   ├── auth/            # 認証関連
│   │   │   ├── LoginForm/
│   │   │   ├── RegisterForm/
│   │   │   └── ProtectedRoute/
│   │   ├── dashboard/       # ダッシュボード
│   │   │   ├── DashboardLayout/
│   │   │   ├── WidgetContainer/
│   │   │   └── StatCard/
│   │   ├── tasks/          # タスク管理
│   │   │   ├── TaskList/
│   │   │   ├── TaskCard/
│   │   │   ├── TaskForm/
│   │   │   └── TaskFilter/
│   │   ├── chat/          # チャット機能
│   │   │   ├── ChatContainer/
│   │   │   ├── MessageList/
│   │   │   ├── MessageInput/
│   │   │   └── MessageBubble/
│   │   └── schedule/      # スケジュール
│   │       ├── Calendar/
│   │       ├── EventForm/
│   │       └── EventDetail/
│   ├── pages/             # ページコンポーネント
│   │   ├── Dashboard.tsx
│   │   ├── Login.tsx
│   │   ├── Chat.tsx
│   │   ├── Tasks.tsx
│   │   └── Schedule.tsx
│   ├── contexts/          # React Context
│   │   ├── AuthContext.tsx
│   │   ├── TaskContext.tsx
│   │   ├── ChatContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/             # カスタムフック
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   ├── useAPI.ts
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   ├── services/          # 外部サービス連携
│   │   ├── api.ts
│   │   ├── socket.ts
│   │   └── storage.ts
│   ├── utils/             # ユーティリティ関数
│   │   ├── formatters.ts
│   │   ├── validators.ts
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── types/             # TypeScript型定義
│   │   ├── auth.ts
│   │   ├── task.ts
│   │   ├── chat.ts
│   │   └── api.ts
│   ├── styles/            # スタイル関連
│   │   ├── theme.ts
│   │   ├── globalStyles.ts
│   │   └── components/
│   ├── App.tsx            # メインアプリコンポーネント
│   ├── main.tsx          # エントリーポイント
│   └── vite-env.d.ts     # Vite型定義
├── tests/                # テストファイル
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── e2e/
├── docs/                 # ドキュメント
├── package.json
├── vite.config.ts
├── tsconfig.json
└── tailwind.config.js
```

## 3. コンポーネント設計

### 3.1 コンポーネント階層
```
App
├── AuthProvider
├── ThemeProvider
├── Router
│   ├── ProtectedRoute
│   │   ├── DashboardLayout
│   │   │   ├── Header
│   │   │   ├── Sidebar
│   │   │   └── MainContent
│   │   │       ├── Dashboard
│   │   │       │   ├── TaskSummary
│   │   │       │   ├── ScheduleWidget
│   │   │       │   └── QuickActions
│   │   │       ├── Tasks
│   │   │       │   ├── TaskFilter
│   │   │       │   ├── TaskList
│   │   │       │   └── TaskForm
│   │   │       ├── Chat
│   │   │       │   ├── MessageList
│   │   │       │   └── MessageInput
│   │   │       └── Schedule
│   │   │           ├── Calendar
│   │   │           └── EventForm
│   │   └── Footer
│   └── PublicRoute
│       ├── Login
│       └── Register
└── NotificationProvider
```

### 3.2 Props Design Patterns
```typescript
// Container Component Pattern
interface TaskListContainerProps {
  filter?: TaskFilter;
  onTaskUpdate?: (task: Task) => void;
}

// Presentation Component Pattern
interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

// Compound Component Pattern
interface TaskCardProps {
  task: Task;
  children?: React.ReactNode;
}

TaskCard.Header = ({ title, priority }: { title: string, priority: Priority }) => {...}
TaskCard.Body = ({ description }: { description: string }) => {...}
TaskCard.Actions = ({ onEdit, onDelete }: { onEdit: () => void, onDelete: () => void }) => {...}
```

## 4. 状態管理

### 4.1 Context構造
```typescript
// AuthContext
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  refreshToken: () => Promise<void>;
}

// TaskContext
interface TaskState {
  tasks: Task[];
  selectedTask: Task | null;
  filter: TaskFilter;
  isLoading: boolean;
  error: string | null;
}

interface TaskContextType extends TaskState {
  fetchTasks: () => Promise<void>;
  createTask: (task: CreateTaskData) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  selectTask: (task: Task | null) => void;
}

// ChatContext
interface ChatState {
  messages: Message[];
  isConnected: boolean;
  isTyping: boolean;
  currentConversation: string | null;
}

interface ChatContextType extends ChatState {
  sendMessage: (content: string) => void;
  sendAIMessage: (message: string, model?: string) => void;
  clearMessages: () => void;
  loadHistory: (conversationId: string) => Promise<void>;
}
```

### 4.2 Context Provider Structure
```typescript
export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <TaskProvider>
            <ChatProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </ChatProvider>
          </TaskProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};
```

## 5. ルーティング設計

### 5.1 ルート構成
```typescript
const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "register",
        element: <Register />
      },
      {
        path: "/",
        element: <ProtectedRoute />,
        children: [
          {
            path: "dashboard",
            element: <Dashboard />
          },
          {
            path: "tasks",
            element: <Tasks />,
            children: [
              {
                path: ":taskId",
                element: <TaskDetail />
              }
            ]
          },
          {
            path: "chat",
            element: <Chat />,
            children: [
              {
                path: ":conversationId",
                element: <ChatConversation />
              }
            ]
          },
          {
            path: "schedule",
            element: <Schedule />
          },
          {
            path: "settings",
            element: <Settings />
          }
        ]
      }
    ]
  }
]);
```

### 5.2 認証ガード
```typescript
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
```

## 6. API通信設計

### 6.1 API Service Layer
```typescript
class APIService {
  private baseURL: string;
  private axiosInstance: AxiosInstance;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL;
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Handle token refresh
          await this.refreshToken();
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.axiosInstance.post('/auth/login', { email, password });
    return response.data;
  }

  // Task endpoints
  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const response = await this.axiosInstance.get('/tasks', { params: filter });
    return response.data;
  }

  async createTask(task: CreateTaskData): Promise<Task> {
    const response = await this.axiosInstance.post('/tasks', task);
    return response.data;
  }
}

export const apiService = new APIService();
```

### 6.2 WebSocket Service
```typescript
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(import.meta.env.VITE_WS_URL, {
        auth: {
          token: localStorage.getItem('access_token')
        }
      });

      this.socket.on('connect', () => {
        this.reconnectAttempts = 0;
        resolve();
      });

      this.socket.on('disconnect', () => {
        this.handleReconnect();
      });

      this.socket.on('connect_error', (error) => {
        reject(error);
      });
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.connect(), 1000 * this.reconnectAttempts);
    }
  }

  sendMessage(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  onMessage(event: string, callback: (data: any) => void) {
    this.socket?.on(event, callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export const socketService = new SocketService();
```

## 7. パフォーマンス最適化

### 7.1 コード分割
```typescript
// Route-based code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Chat = lazy(() => import('./pages/Chat'));
const Schedule = lazy(() => import('./pages/Schedule'));

// Component-based code splitting
const TaskForm = lazy(() => import('./components/tasks/TaskForm'));
const Calendar = lazy(() => import('./components/schedule/Calendar'));

// Lazy loading with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/tasks" element={<Tasks />} />
    <Route path="/chat" element={<Chat />} />
    <Route path="/schedule" element={<Schedule />} />
  </Routes>
</Suspense>
```

### 7.2 メモ化戦略
```typescript
// Component memoization
const TaskCard = React.memo<TaskCardProps>(({ task, onEdit, onDelete }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6">{task.title}</Typography>
        <Typography variant="body2">{task.description}</Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => onEdit(task)}>Edit</Button>
        <Button onClick={() => onDelete(task.id)}>Delete</Button>
      </CardActions>
    </Card>
  );
});

// Expensive calculations
const TaskStats = ({ tasks }: { tasks: Task[] }) => {
  const stats = useMemo(() => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'DONE').length,
      pending: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length
    };
  }, [tasks]);

  return <StatsDisplay stats={stats} />;
};

// Callback memoization
const TaskList = ({ tasks }: { tasks: Task[] }) => {
  const handleTaskEdit = useCallback((task: Task) => {
    // Edit logic
  }, []);

  const handleTaskDelete = useCallback((taskId: string) => {
    // Delete logic
  }, []);

  return (
    <List>
      {tasks.map(task => (
        <TaskCard
          key={task.id}
          task={task}
          onEdit={handleTaskEdit}
          onDelete={handleTaskDelete}
        />
      ))}
    </List>
  );
};
```

### 7.3 キャッシュ戦略
```typescript
// React Query for server state management
const useTasksQuery = (filter?: TaskFilter) => {
  return useQuery({
    queryKey: ['tasks', filter],
    queryFn: () => apiService.getTasks(filter),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Local storage cache
const useCachedData = <T>(key: string, fetcher: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cachedData = localStorage.getItem(key);
    if (cachedData) {
      setData(JSON.parse(cachedData));
      setLoading(false);
    } else {
      fetcher().then(result => {
        setData(result);
        localStorage.setItem(key, JSON.stringify(result));
        setLoading(false);
      });
    }
  }, [key]);

  return { data, loading };
};
```

## 8. エラーハンドリング

### 8.1 Error Boundary
```typescript
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // Log error to monitoring service
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="50vh"
        >
          <Typography variant="h4" gutterBottom>
            Something went wrong
          </Typography>
          <Typography variant="body1" color="textSecondary">
            We're sorry, but something went wrong. Please try refreshing the page.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.reload()}
            sx={{ mt: 2 }}
          >
            Refresh Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}
```

### 8.2 API Error Handling
```typescript
interface ApiError {
  message: string;
  code: string;
  statusCode: number;
}

const useErrorHandler = () => {
  const showNotification = useNotification();

  const handleError = useCallback((error: unknown) => {
    if (axios.isAxiosError(error)) {
      const apiError: ApiError = error.response?.data || {
        message: 'Network error occurred',
        code: 'NETWORK_ERROR',
        statusCode: error.response?.status || 500
      };

      switch (apiError.statusCode) {
        case 400:
          showNotification('Invalid request. Please check your input.', 'error');
          break;
        case 401:
          showNotification('Authentication required. Please log in.', 'error');
          // Redirect to login
          break;
        case 403:
          showNotification('Access denied. You don\'t have permission.', 'error');
          break;
        case 404:
          showNotification('Resource not found.', 'error');
          break;
        case 500:
          showNotification('Server error. Please try again later.', 'error');
          break;
        default:
          showNotification(apiError.message || 'An error occurred', 'error');
      }
    } else {
      showNotification('An unexpected error occurred', 'error');
    }
  }, [showNotification]);

  return { handleError };
};
```

## 9. テスト設計

### 9.1 テスト構造
```typescript
// Component testing
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TaskCard } from './TaskCard';

describe('TaskCard', () => {
  const mockTask = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });
});

// Hook testing
import { renderHook, act } from '@testing-library/react';
import { useAuth } from './useAuth';

describe('useAuth', () => {
  it('should login successfully', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.login('test@example.com', 'password');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toBeTruthy();
  });
});
```

### 9.2 E2E Testing
```typescript
// Cypress E2E tests
describe('Task Management', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password');
    cy.visit('/tasks');
  });

  it('should create a new task', () => {
    cy.get('[data-testid="add-task-button"]').click();
    cy.get('[data-testid="task-title-input"]').type('New Task');
    cy.get('[data-testid="task-description-input"]').type('Task description');
    cy.get('[data-testid="task-priority-select"]').click();
    cy.get('[data-value="HIGH"]').click();
    cy.get('[data-testid="save-task-button"]').click();

    cy.get('[data-testid="task-list"]').should('contain', 'New Task');
  });

  it('should filter tasks by status', () => {
    cy.get('[data-testid="status-filter"]').click();
    cy.get('[data-value="DONE"]').click();

    cy.get('[data-testid="task-card"]').each($el => {
      cy.wrap($el).should('contain', 'Completed');
    });
  });
});
```

## 10. セキュリティ考慮事項

### 10.1 XSS Prevention
```typescript
// Input sanitization
import DOMPurify from 'dompurify';

const SafeHTML: React.FC<{ content: string }> = ({ content }) => {
  const sanitizedContent = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />;
};

// Content Security Policy
const cspMeta = (
  <meta
    httpEquiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ws://localhost:3001 http://localhost:3001"
  />
);
```

### 10.2 Authentication Security
```typescript
// Token management
class TokenManager {
  private static ACCESS_TOKEN_KEY = 'access_token';
  private static REFRESH_TOKEN_KEY = 'refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
```

## 11. デプロイメント設定

### 11.1 Build Configuration
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@services': resolve(__dirname, 'src/services'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@types': resolve(__dirname, 'src/types')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material'],
          socket: ['socket.io-client'],
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
```

### 11.2 Environment Configuration
```typescript
// Environment variables
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WS_URL: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Config service
class ConfigService {
  static get apiUrl(): string {
    return import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  static get wsUrl(): string {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  }

  static get appName(): string {
    return import.meta.env.VITE_APP_NAME || 'myJarvis';
  }

  static get isDevelopment(): boolean {
    return import.meta.env.DEV;
  }

  static get isProduction(): boolean {
    return import.meta.env.PROD;
  }
}
```

---

このアーキテクチャ設計書は、myJarvisフロントエンドの技術基盤と実装指針を定義しています。開発の進行に応じて継続的に更新されます。