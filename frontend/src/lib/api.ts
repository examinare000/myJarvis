const API_BASE_URL = '/api/v1';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

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

    return response.json();
  }

  // Tasks API
  async getTodayTasks() {
    return this.request('/tasks/today');
  }

  async updateTaskStatus(taskId: string, status: string) {
    return this.request(`/tasks/${taskId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async getTodayTaskStats() {
    return this.request('/tasks/stats/today');
  }

  async createTask(taskData: {
    title: string;
    description?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    dueDate?: string;
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  }) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  // Lifelog API
  async getLifelogEntries(params?: {
    limit?: number;
    offset?: number;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const query = searchParams.toString();
    return this.request(`/lifelog/entries${query ? `?${query}` : ''}`);
  }

  async createLifelogEntry(entryData: {
    content: string;
    tags?: string[];
    mood?: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    images?: string[];
    locationLat?: number;
    locationLng?: number;
    locationName?: string;
  }) {
    return this.request('/lifelog/entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    });
  }

  async updateLifelogEntry(entryId: string, entryData: Partial<{
    content: string;
    tags: string[];
    mood: 'great' | 'good' | 'okay' | 'bad' | 'terrible';
    images: string[];
    locationLat: number;
    locationLng: number;
    locationName: string;
  }>) {
    return this.request(`/lifelog/entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData),
    });
  }

  async deleteLifelogEntry(entryId: string) {
    return this.request(`/lifelog/entries/${entryId}`, {
      method: 'DELETE',
    });
  }

  // Calendar API
  async getCalendarEvents(params?: {
    from?: string;
    to?: string;
  }) {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from', params.from);
    if (params?.to) searchParams.set('to', params.to);

    const query = searchParams.toString();
    return this.request(`/calendar/events${query ? `?${query}` : ''}`);
  }

  async createCalendarEvent(eventData: {
    title: string;
    description?: string;
    startTime: string;
    endTime: string;
    color?: string;
  }) {
    return this.request('/calendar/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    });
  }

  async updateCalendarEvent(eventId: string, eventData: Partial<{
    title: string;
    description: string;
    startTime: string;
    endTime: string;
    color: string;
  }>) {
    return this.request(`/calendar/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });
  }

  async deleteCalendarEvent(eventId: string) {
    return this.request(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();