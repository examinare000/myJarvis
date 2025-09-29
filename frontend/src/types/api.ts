/**
 * APIの型定義
 */

// Task
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface TodayTaskStats {
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

// Lifelog
export interface LifelogEntry {
  id: string;
  userId: string;
  content: string;
  tags: string[];
  mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
  images: string[];
  locationLat?: number;
  locationLng?: number;
  locationName?: string;
  createdAt: string;
  updatedAt: string;
}

// Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  color?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}
