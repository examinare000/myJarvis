import apiClient from './api';

export interface ProductivityOverview {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  completionRate: number;
  overdueTasks: number;
  avgCompletionTimeHours: number;
}

export interface TasksByDay {
  date: string;
  total: number;
  completed: number;
  inProgress: number;
  pending: number;
}

export interface PriorityDistribution {
  priority: string;
  count: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface ProductivityAnalytics {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  overview: ProductivityOverview;
  charts: {
    tasksByDay: TasksByDay[];
    priorityDistribution: PriorityDistribution[];
    statusDistribution: StatusDistribution[];
  };
}

export interface MoodEntry {
  mood: string;
  count: number;
}

export interface MoodByDay {
  date: string;
  moods: MoodEntry[];
}

export interface MoodTagContext {
  mood: string;
  topTags: Array<{
    tag: string;
    count: number;
  }>;
}

export interface MoodAnalytics {
  timeframe: string;
  period: {
    start: string;
    end: string;
  };
  overview: {
    totalEntries: number;
    dominantMood: string;
    moodVariety: number;
  };
  charts: {
    moodFrequency: MoodEntry[];
    moodByDay: MoodByDay[];
    moodTagsContext: MoodTagContext[];
  };
}

export interface ActivityTrend {
  date: string;
  tasks: number;
  lifelogs: number;
  events: number;
  total: number;
}

export interface SummaryAnalytics {
  period: {
    start: string;
    end: string;
  };
  summary: {
    tasks: {
      total: number;
      completed: number;
      completionRate: number;
    };
    mood: {
      entries: number;
      dominant: string;
    };
    events: {
      total: number;
      upcoming: number;
    };
    activityTrend: ActivityTrend[];
  };
}

class AnalyticsService {
  /**
   * Get productivity analytics
   */
  async getProductivityAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<ProductivityAnalytics> {
    try {
      const response = await apiClient.get('/analytics/productivity', {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching productivity analytics:', error);
      throw error;
    }
  }

  /**
   * Get mood analytics
   */
  async getMoodAnalytics(timeframe: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<MoodAnalytics> {
    try {
      const response = await apiClient.get('/analytics/mood', {
        params: { timeframe },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood analytics:', error);
      throw error;
    }
  }

  /**
   * Get summary analytics
   */
  async getSummaryAnalytics(): Promise<SummaryAnalytics> {
    try {
      const response = await apiClient.get('/analytics/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching summary analytics:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();