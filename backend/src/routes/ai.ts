import express, { Request, Response } from 'express';
import fetch from 'node-fetch';
import { authenticateToken } from '../middleware/auth';
import { AIService, SmartSchedulingRequest, ContextAnalysisRequest } from '../services/ai.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = express.Router();
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * POST /api/v1/ai/chat
 * Proxy chat requests to the AI service
 */
router.post('/chat', authenticateToken, async (req: Request, res: Response): Promise<Response | void> => {
  const { stream = false } = req.body;

  try {
    const response = await fetch(`${AI_SERVICE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    if (stream && response.body) {
      // For streaming responses, pipe directly to client
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // @ts-ignore - node-fetch body is readable stream
      response.body.pipe(res);
    } else {
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('AI service proxy error:', error);
    res.status(503).json({
      error: 'AI service is unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/v1/ai/models
 * Get available AI models from the AI service
 */
router.get('/models', authenticateToken, async (req: Request, res: Response): Promise<Response | void> => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/ollama/models`);

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).send(errorText);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI models fetch error:', error);
    res.status(503).json({
      error: 'AI service is unavailable',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/v1/ai/smart-scheduling
 * Generate optimized schedule based on tasks and events
 */
router.post('/smart-scheduling', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Fetch user's tasks and events
    const [tasks, events] = await Promise.all([
      prisma.task.findMany({
        where: { userId },
        orderBy: { priority: 'desc' },
      }),
      prisma.calendarEvent.findMany({
        where: { userId },
        orderBy: { startTime: 'asc' },
      }),
    ]);

    const schedulingRequest: SmartSchedulingRequest = {
      userId,
      tasks,
      events,
      preferences: req.body.preferences,
    };

    const schedule = await AIService.generateSmartSchedule(schedulingRequest);
    return res.json(schedule);
  } catch (error) {
    console.error('Smart scheduling error:', error);
    return res.status(500).json({
      error: 'Failed to generate schedule',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/v1/ai/context-analysis
 * Analyze user context from lifelogs and tasks
 */
router.post('/context-analysis', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { timeframe = 'week' } = req.body;

    // Calculate date range based on timeframe
    const now = new Date();
    const startDate = new Date();
    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
    }

    // Fetch user's lifelogs and tasks
    const [lifelogs, tasks] = await Promise.all([
      prisma.lifelogEntry.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const analysisRequest: ContextAnalysisRequest = {
      userId,
      lifelogs,
      tasks,
      timeframe,
    };

    const analysis = await AIService.analyzeContext(analysisRequest);
    return res.json(analysis);
  } catch (error) {
    console.error('Context analysis error:', error);
    return res.status(500).json({
      error: 'Failed to analyze context',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/ai/task-suggestions
 * Get AI-generated task suggestions based on context
 */
router.get('/task-suggestions', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { context = '' } = req.query;
    const suggestions = await AIService.generateTaskSuggestions(userId, context as string);

    return res.json({ suggestions });
  } catch (error) {
    console.error('Task suggestions error:', error);
    return res.status(500).json({
      error: 'Failed to generate suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;