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
   * Send chat completion request to AI service
   */
  static async chat(messages: ChatMessage[], stream: boolean = false) {
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
      }),
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.status}`);
    }

    return response;
  }

  /**
   * Generate smart scheduling suggestions based on user data
   */
  static async generateSmartSchedule(request: SmartSchedulingRequest): Promise<SmartSchedulingResponse> {
    // Prepare context for AI
    const systemPrompt = `You are a personal scheduling assistant. Based on the user's tasks, events, and preferences,
    create an optimized schedule. Consider:
    1. Task priorities and deadlines
    2. Working hours preferences
    3. Break times and productivity patterns
    4. Calendar conflicts

    Return a structured JSON response with the optimized schedule, suggestions, and any conflicts detected.`;

    const userPrompt = `Tasks: ${JSON.stringify(request.tasks)}
    Events: ${JSON.stringify(request.events)}
    Preferences: ${JSON.stringify(request.preferences || {})}

    Please create an optimized schedule for the next 7 days.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages, false);
    const data = await response.json();

    // Parse AI response and structure it
    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed as SmartSchedulingResponse;
    } catch (error) {
      // Fallback to a basic schedule if AI response is not properly formatted
      return this.generateBasicSchedule(request);
    }
  }

  /**
   * Analyze user context from lifelogs and tasks
   */
  static async analyzeContext(request: ContextAnalysisRequest): Promise<ContextAnalysisResponse> {
    const systemPrompt = `You are a personal productivity analyst. Analyze the user's lifelogs and tasks to provide:
    1. Productivity score and trends
    2. Mood patterns and their impact
    3. Actionable recommendations
    4. Key insights about their behavior

    Return a structured JSON response.`;

    const userPrompt = `Lifelogs: ${JSON.stringify(request.lifelogs)}
    Tasks: ${JSON.stringify(request.tasks)}
    Timeframe: ${request.timeframe || 'week'}

    Please analyze this data and provide insights.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.chat(messages, false);
    const data = await response.json();

    try {
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content);
      return parsed as ContextAnalysisResponse;
    } catch (error) {
      // Fallback to basic analysis
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