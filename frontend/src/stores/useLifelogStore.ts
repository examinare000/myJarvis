import { create } from 'zustand';

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

interface LifelogState {
  entries: LifelogEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setEntries: (entries: LifelogEntry[]) => void;
  addEntry: (entry: LifelogEntry) => void;
  updateEntry: (entryId: string, updates: Partial<LifelogEntry>) => void;
  removeEntry: (entryId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useLifelogStore = create<LifelogState>((set, get) => ({
  entries: [],
  isLoading: false,
  error: null,

  setEntries: (entries) => set({ entries }),

  addEntry: (entry) => set((state) => ({
    entries: [entry, ...state.entries],
  })),

  updateEntry: (entryId, updates) => set((state) => ({
    entries: state.entries.map(entry =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    ),
  })),

  removeEntry: (entryId) => set((state) => ({
    entries: state.entries.filter(entry => entry.id !== entryId),
  })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),
}));