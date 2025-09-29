import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../services/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

// Token management utilities
class TokenManager {
  private static readonly TOKEN_KEY = 'token';
  private static readonly REFRESH_TOKEN_KEY = 'refreshToken';
  private static refreshTimer: NodeJS.Timeout | null = null;

  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  static setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(refreshToken: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    delete apiClient.defaults.headers.common['Authorization'];
    this.clearRefreshTimer();
  }

  static setupAutoRefresh(refreshFn: () => Promise<boolean>): void {
    this.clearRefreshTimer();

    // Refresh token every 14 minutes (1 minute before expiry)
    this.refreshTimer = setInterval(async () => {
      try {
        const success = await refreshFn();
        if (!success) {
          this.clearRefreshTimer();
        }
      } catch (error) {
        console.error('Auto refresh failed:', error);
        this.clearRefreshTimer();
      }
    }, 14 * 60 * 1000);
  }

  static clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post('/auth/login', { email, password });
          const { user, token, refreshToken } = response.data;

          // Update tokens
          TokenManager.setToken(token);
          TokenManager.setRefreshToken(refreshToken);

          // Update state
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Setup auto refresh
          TokenManager.setupAutoRefresh(get().refreshAuth);

          console.log('Login successful:', user.email);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'ログインに失敗しました';
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          TokenManager.clearTokens();
          throw error;
        }
      },

      register: async (email: string, password: string, name?: string) => {
        set({ isLoading: true, error: null });

        try {
          const response = await apiClient.post('/auth/register', { email, password, name });
          const { user, token, refreshToken } = response.data;

          // Update tokens
          TokenManager.setToken(token);
          TokenManager.setRefreshToken(refreshToken);

          // Update state
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Setup auto refresh
          TokenManager.setupAutoRefresh(get().refreshAuth);

          console.log('Registration successful:', user.email);
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || '登録に失敗しました';
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          TokenManager.clearTokens();
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });

        try {
          const refreshToken = get().refreshToken;
          if (refreshToken) {
            await apiClient.post('/auth/logout', { refreshToken });
          }
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if API call fails
        } finally {
          // Clear everything
          TokenManager.clearTokens();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
          console.log('Logout completed');
        }
      },

      refreshAuth: async () => {
        const currentRefreshToken = get().refreshToken || TokenManager.getRefreshToken();
        if (!currentRefreshToken) {
          return false;
        }

        try {
          const response = await apiClient.post('/auth/refresh', {
            refreshToken: currentRefreshToken
          });
          const { token, refreshToken: newRefreshToken } = response.data;

          // Update tokens
          TokenManager.setToken(token);
          TokenManager.setRefreshToken(newRefreshToken);

          // Update state
          set({
            token,
            refreshToken: newRefreshToken,
            error: null,
          });

          console.log('Token refreshed successfully');
          return true;
        } catch (error: any) {
          console.error('Token refresh failed:', error);

          // Clear everything on refresh failure
          TokenManager.clearTokens();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            error: 'セッションが期限切れです。再ログインしてください。',
          });

          return false;
        }
      },

      getCurrentUser: async () => {
        const token = get().token || TokenManager.getToken();
        if (!token) {
          return;
        }

        set({ isLoading: true });

        try {
          // Set token in API client if not already set
          if (!apiClient.defaults.headers.common['Authorization']) {
            TokenManager.setToken(token);
          }

          const response = await apiClient.get('/auth/me');
          const user = response.data;

          set({
            user,
            token,
            refreshToken: get().refreshToken || TokenManager.getRefreshToken(),
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Setup auto refresh if we have a refresh token
          const refreshToken = get().refreshToken || TokenManager.getRefreshToken();
          if (refreshToken) {
            TokenManager.setupAutoRefresh(get().refreshAuth);
          }

          console.log('Current user loaded:', user.email);
        } catch (error: any) {
          console.error('Failed to get current user:', error);

          if (error.response?.status === 401) {
            // Token is invalid, try to refresh
            const refreshSuccess = await get().refreshAuth();
            if (refreshSuccess) {
              // Retry getting current user after successful refresh
              return get().getCurrentUser();
            }
          }

          // Clear everything on failure
          TokenManager.clearTokens();
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist essential data
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Initialize API client with stored token
        if (state?.token) {
          TokenManager.setToken(state.token);

          // Verify token and user on app start
          state.getCurrentUser();
        }
      },
    }
  )
);

// API client interceptor for automatic token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const authStore = useAuthStore.getState();
      const refreshSuccess = await authStore.refreshAuth();

      if (refreshSuccess) {
        // Retry the original request with the new token
        const newToken = authStore.token;
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return apiClient.request(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

export default useAuthStore;