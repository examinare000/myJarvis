import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  completionRate: number;
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

interface TaskState {
  todayTasks: Task[];
  taskStats: TaskStats | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setTodayTasks: (tasks: Task[]) => void;
  setTaskStats: (stats: TaskStats) => void;
  updateTaskInList: (taskId: string, updates: Partial<Task>) => void;
  addTask: (task: Task) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  todayTasks: [],
  taskStats: null,
  isLoading: false,
  error: null,

  setTodayTasks: (tasks) => set({ todayTasks: tasks }),

  setTaskStats: (stats) => set({ taskStats: stats }),

  updateTaskInList: (taskId, updates) => set((state) => ({
    todayTasks: state.todayTasks.map(task =>
      task.id === taskId ? { ...task, ...updates } : task
    ),
  })),

  addTask: (task) => set((state) => ({
    todayTasks: [task, ...state.todayTasks],
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));