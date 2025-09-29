import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface SmartSchedulingRequest {
  userId: string;
  tasks: any[];
  events: any[];
  preferences?: {
    workingHours?: { start: string; end: string };
    breakDuration?: number;
    maxTasksPerDay?: number;
  };
}

export interface SmartSchedulingResponse {
  optimizedSchedule: {
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
  }[];
  suggestions: string[];
  conflicts: string[];
}

export interface ContextAnalysisRequest {
  userId: string;
  lifelogs: any[];
  tasks: any[];
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
    patterns: Array<{ mood: string; frequency: number; context: string }>;
  };
  recommendations: string[];
  insights: string[];
}

export class AIService {
  /**
   * Check if AI service is available
   */
  static async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        method: 'GET',
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      console.warn('AI service is not available:', error);
      return false;
    }
  }

  /**
   * Send chat completion request to AI service
   */
  static async chat(messages: ChatMessage[], stream: boolean = false) {
    // Check if AI service is available
    const isAvailable = await this.isAvailable();
    if (!isAvailable) {
      throw new Error('AI service is currently unavailable');
    }

    const response = await fetch(`${AI_SERVICE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama3.2',
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      timeout: 30000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI service error (${response.status}): ${errorText}`);
    }

    return response;
  }

  /**
   * Generate smart scheduling suggestions based on user data
   */
  static async generateSmartSchedule(request: SmartSchedulingRequest): Promise<SmartSchedulingResponse> {
    try {
      // Check if AI service is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.log('AI service unavailable, using basic scheduling');
        return this.generateBasicSchedule(request);
      }

      // Prepare context for AI
      const systemPrompt = `You are a personal scheduling assistant. Based on the user's tasks, events, and preferences, create an optimized schedule.

Consider:
1. Task priorities (HIGH, MEDIUM, LOW) and deadlines
2. Working hours preferences
3. Break times and productivity patterns
4. Calendar conflicts
5. Task status (TODO, IN_PROGRESS, DONE)

Return ONLY a valid JSON response with this exact structure:
{
  "optimizedSchedule": [
    {
      "date": "2023-10-01",
      "tasks": [
        {
          "id": "task-id",
          "title": "Task title",
          "suggestedTime": "09:00",
          "duration": 60,
          "priority": "HIGH",
          "reason": "High priority task scheduled for peak hours"
        }
      ],
      "events": []
    }
  ],
  "suggestions": ["Take breaks every 2 hours"],
  "conflicts": []
}`;

      const userPrompt = `Tasks: ${JSON.stringify(request.tasks, null, 2)}
Events: ${JSON.stringify(request.events, null, 2)}
Preferences: ${JSON.stringify(request.preferences || {}, null, 2)}

Please create an optimized schedule for the next 7 days.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.chat(messages, false);
      const data = await response.json();

      // Parse AI response and structure it
      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log('AI Response content:', content);

        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.optimizedSchedule && Array.isArray(parsed.optimizedSchedule)) {
            return parsed as SmartSchedulingResponse;
          }
        }
      }

      console.warn('AI response format invalid, using fallback');
      return this.generateBasicSchedule(request);
    } catch (error) {
      console.error('Smart scheduling AI error:', error);
      return this.generateBasicSchedule(request);
    }
  }

  /**
   * Analyze user context from lifelogs and tasks
   */
  static async analyzeContext(request: ContextAnalysisRequest): Promise<ContextAnalysisResponse> {
    try {
      // Check if AI service is available
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        console.log('AI service unavailable, using basic analysis');
        return this.generateBasicAnalysis(request);
      }

      const systemPrompt = `You are a personal productivity analyst. Analyze the user's lifelogs and tasks to provide insights.

Return ONLY a valid JSON response with this exact structure:
{
  "productivity": {
    "score": 75,
    "trend": "improving",
    "factors": ["Task completion rate", "Time management"]
  },
  "mood": {
    "dominant": "happy",
    "patterns": [
      {
        "mood": "happy",
        "frequency": 5,
        "context": "Morning tasks"
      }
    ]
  },
  "recommendations": ["Take regular breaks", "Focus on high-priority tasks"],
  "insights": ["You are most productive in the morning", "Task completion improves with breaks"]
}`;

      const userPrompt = `Lifelogs: ${JSON.stringify(request.lifelogs, null, 2)}
Tasks: ${JSON.stringify(request.tasks, null, 2)}
Timeframe: ${request.timeframe || 'week'}

Analyze this data and provide productivity insights.`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ];

      const response = await this.chat(messages, false);
      const data = await response.json();

      if (data.choices && data.choices[0] && data.choices[0].message) {
        const content = data.choices[0].message.content.trim();
        console.log('AI Analysis content:', content);

        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.productivity && parsed.mood) {
            return parsed as ContextAnalysisResponse;
          }
        }
      }

      console.warn('AI analysis format invalid, using fallback');
      return this.generateBasicAnalysis(request);
    } catch (error) {
      console.error('Context analysis AI error:', error);
      return this.generateBasicAnalysis(request);
    }
  }

  /**
   * Generate task suggestions based on user patterns
   */
  static async generateTaskSuggestions(userId: string, context: string): Promise<string[]> {
    const userHistory = await this.getUserHistory(userId);

    const systemPrompt = `Based on the user's task history and current context, suggest 3-5 relevant tasks they might want to add.`;
    const userPrompt = `Context: ${context}\nHistory: ${JSON.stringify(userHistory)}`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages, false);
    const data = await response.json();

    try {
      const content = data.choices[0].message.content;
      const suggestions = content.split('\n').filter((s: string) => s.trim());
      return suggestions;
    } catch (error) {
      return [];
    }
  }

  /**
   * Helper: Generate basic schedule without AI
   */
  private static generateBasicSchedule(request: SmartSchedulingRequest): SmartSchedulingResponse {
    const schedule = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const dayTasks = request.tasks
        .filter(t => t.status !== 'DONE')
        .slice(i * 3, (i + 1) * 3)
        .map((task, index) => ({
          id: task.id,
          title: task.title,
          suggestedTime: `${9 + index * 2}:00`,
          duration: 60,
          priority: task.priority || 'medium',
          reason: 'Evenly distributed based on priority',
        }));

      schedule.push({
        date: date.toISOString().split('T')[0],
        tasks: dayTasks,
        events: request.events.filter(e => {
          const eventDate = new Date(e.startTime);
          return eventDate.toDateString() === date.toDateString();
        }),
      });
    }

    return {
      optimizedSchedule: schedule,
      suggestions: ['Consider taking regular breaks', 'Focus on high-priority tasks first'],
      conflicts: [],
    };
  }

  /**
   * Helper: Generate basic analysis without AI
   */
  private static generateBasicAnalysis(request: ContextAnalysisRequest): ContextAnalysisResponse {
    const completedTasks = request.tasks.filter(t => t.status === 'DONE').length;
    const totalTasks = request.tasks.length;
    const productivityScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const moodFrequency = request.lifelogs.reduce((acc: any, log: any) => {
      if (log.mood) {
        acc[log.mood] = (acc[log.mood] || 0) + 1;
      }
      return acc;
    }, {});

    const dominantMood = Object.keys(moodFrequency).reduce((a, b) =>
      moodFrequency[a] > moodFrequency[b] ? a : b, 'neutral'
    );

    return {
      productivity: {
        score: Math.round(productivityScore),
        trend: productivityScore > 70 ? 'improving' : productivityScore > 40 ? 'stable' : 'declining',
        factors: ['Task completion rate', 'Time management'],
      },
      mood: {
        dominant: dominantMood,
        patterns: Object.entries(moodFrequency).map(([mood, freq]) => ({
          mood,
          frequency: freq as number,
          context: 'General activity',
        })),
      },
      recommendations: [
        'Maintain consistent work schedule',
        'Take regular breaks to improve focus',
      ],
      insights: [
        `You completed ${completedTasks} out of ${totalTasks} tasks`,
        `Your dominant mood has been ${dominantMood}`,
      ],
    };
  }

  /**
   * Helper: Get user history for context
   */
  private static async getUserHistory(userId: string) {
    const [recentTasks, recentLogs] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { title: true, priority: true, status: true },
      }),
      prisma.lifelogEntry.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { content: true, mood: true, tags: true },
      }),
    ]);

    return { recentTasks, recentLogs };
  }
}