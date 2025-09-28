import { create } from 'zustand';

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

interface CalendarState {
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  removeEvent: (eventId: string) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],
  selectedEvent: null,
  isLoading: false,
  error: null,

  setEvents: (events) => set({ events }),

  addEvent: (event) => set((state) => ({
    events: [...state.events, event],
  })),

  updateEvent: (eventId, updates) => set((state) => ({
    events: state.events.map(event =>
      event.id === eventId ? { ...event, ...updates } : event
    ),
  })),

  removeEvent: (eventId) => set((state) => ({
    events: state.events.filter(event => event.id !== eventId),
  })),

  setSelectedEvent: (event) => set({ selectedEvent: event }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));