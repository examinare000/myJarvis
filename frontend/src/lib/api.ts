import type { Task, TodayTaskStats, LifelogEntry, CalendarEvent } from '@/types/api';

const API_BASE_URL = '/api/v1';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    try {
      return (await response.json()) as T;
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        return undefined as T;
      }

      throw error;
    }
  }

  // Tasks API
  async getTodayTasks(): Promise<Task[]> {
    return this.request<Task[]>('/tasks/today');
  }

  async updateTaskStatus(taskId: string, status: Task['status']): Promise<Task> {
    return this.request<Task>(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getTodayTaskStats(): Promise<TodayTaskStats> {
    return this.request<TodayTaskStats>('/tasks/stats/today');
  }

  async createTask(taskData: {
    title: Task['title'];
    description?: Task['description'];
    priority?: Task['priority'];
    dueDate?: Task['dueDate'];
    status?: Task['status'];
  }): Promise<Task> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  // Lifelog API
  async getLifelogEntries(params?: {
    limit?: number;
    offset?: number;
  }): Promise<LifelogEntry[]> {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request<LifelogEntry[]>(`/lifelog/entries${query ? `?${query}` : ''}`);
  }

  async createLifelogEntry(entryData: {
    content: string;
    tags?: string[];
    mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    images?: string[];
    locationLat?: number;
    locationLng?: number;
    locationName?: string;
  }): Promise<LifelogEntry> {
    return this.request<LifelogEntry>('/lifelog/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateLifelogEntry(entryId: string, entryData: Partial<Omit<LifelogEntry,
    'id' | 'createdAt' | 'updatedAt'
  >>): Promise<LifelogEntry> {
    return this.request<LifelogEntry>(`/lifelog/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteLifelogEntry(entryId: string): Promise<void> {
    return this.request<void>(`/lifelog/entries/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Calendar API
  async getCalendarEvents(params?: {
    from?: string;
    to?: string;
  }): Promise<CalendarEvent[]> {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);

    const query = searchParams.toString();
    return this.request<CalendarEvent[]>(`/calendar/events${query ? `?${query}` : ''}`);
  }

  async createCalendarEvent(eventData: Pick<CalendarEvent,
    'title' | 'description' | 'startTime' | 'endTime' | 'color'
  >): Promise<CalendarEvent> {
    return this.request<CalendarEvent>('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateCalendarEvent(
    eventId: string,
    eventData: Partial<Pick<CalendarEvent, 'title' | 'description' | 'startTime' | 'endTime' | 'color'>>
  ): Promise<CalendarEvent> {
    return this.request<CalendarEvent>(`/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteCalendarEvent(eventId: string): Promise<void> {
    return this.request<void>(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
