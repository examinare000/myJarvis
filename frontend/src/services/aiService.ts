import apiClient from './api';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  stream?: boolean;
  model?: string;
  temperature?: number;
}

export interface SmartSchedulingPreferences {
  workingHours?: { start: string; end: string };
  breakDuration?: number;
  maxTasksPerDay?: number;
}

export interface SmartSchedulingResponse {
  optimizedSchedule: Array<{
    date: string;
    tasks: Array<{
      id: string;
      title: string;
      suggestedTime: string;
      duration: number;
      priority: string;
      reason: string;
    }>;
    events: any[];
  }>;
  suggestions: string[];
  conflicts: string[];
}

export interface ContextAnalysisTimeframe {
  timeframe?: 'day' | 'week' | 'month';
}

export interface ContextAnalysisResponse {
  productivity: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    factors: string[];
  };
  mood: {
    dominant: string;
    patterns: Array<{
      mood: string;
      frequency: number;
      context: string;
    }>;
  };
  recommendations: string[];
  insights: string[];
}

export interface TaskSuggestion {
  suggestions: string[];
}

class AIService {
  /**
   * Send a chat completion request to the AI service
   */
  async chat(request: ChatCompletionRequest) {
    try {
      const response = await apiClient.post('/ai/chat', request);
      return response.data;
    } catch (error) {
      console.error('Error sending chat request:', error);
      throw error;
    }
  }

  /**
   * Stream chat completion from the AI service
   */
  async streamChat(request: ChatCompletionRequest, onMessage: (chunk: string) => void) {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...request, stream: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Response body is not readable');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.choices?.[0]?.delta?.content) {
                onMessage(data.choices[0].delta.content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming chat:', error);
      throw error;
    }
  }

  /**
   * Get available AI models
   */
  async getModels() {
    try {
      const response = await apiClient.get('/ai/models');
      return response.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  }

  /**
   * Generate smart scheduling recommendations
   */
  async generateSmartSchedule(preferences?: SmartSchedulingPreferences): Promise<SmartSchedulingResponse> {
    try {
      const response = await apiClient.post('/ai/smart-scheduling', { preferences });
      return response.data;
    } catch (error) {
      console.error('Error generating smart schedule:', error);
      throw error;
    }
  }

  /**
   * Analyze user context and productivity
   */
  async analyzeContext(params?: ContextAnalysisTimeframe): Promise<ContextAnalysisResponse> {
    try {
      const response = await apiClient.post('/ai/context-analysis', params || {});
      return response.data;
    } catch (error) {
      console.error('Error analyzing context:', error);
      throw error;
    }
  }

  /**
   * Get task suggestions based on context
   */
  async getTaskSuggestions(context?: string): Promise<TaskSuggestion> {
    try {
      const response = await apiClient.get('/ai/task-suggestions', {
        params: { context },
      });
      return response.data;
    } catch (error) {
      console.error('Error getting task suggestions:', error);
      throw error;
    }
  }
}

export default new AIService();