import { create } from 'zustand';
import type { Task as ApiTask, TodayTaskStats } from '@/types/api';

export type Task = ApiTask;

export type TaskStats = TodayTaskStats;

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

export const useTaskStore = create<TaskState>((set) => ({
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
