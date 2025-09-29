import express, { Request, Response } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/analytics/productivity
 * Get productivity analytics for the authenticated user
 */
router.get('/productivity', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { timeframe = 'week' } = req.query;

    // Calculate date range
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
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch tasks data
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
        dueDate: true,
      },
    });

    // Calculate productivity metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
    const inProgressTasks = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const pendingTasks = tasks.filter(t => t.status === TaskStatus.TODO).length;

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Task completion by day
    const tasksByDay = tasks.reduce((acc: Record<string, any>, task) => {
      const date = task.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { total: 0, completed: 0, inProgress: 0, pending: 0 };
      }
      acc[date].total++;
      if (task.status === TaskStatus.DONE) acc[date].completed++;
      if (task.status === TaskStatus.IN_PROGRESS) acc[date].inProgress++;
      if (task.status === TaskStatus.TODO) acc[date].pending++;
      return acc;
    }, {});

    // Priority distribution
    const priorityDistribution = tasks.reduce((acc: Record<string, number>, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    // Average completion time (for completed tasks)
    const completedTasksWithTime = tasks.filter(t => t.status === TaskStatus.DONE);
    const avgCompletionTime = completedTasksWithTime.length > 0
      ? completedTasksWithTime.reduce((sum, task) => {
          const timeDiff = task.updatedAt.getTime() - task.createdAt.getTime();
          return sum + timeDiff;
        }, 0) / completedTasksWithTime.length
      : 0;

    // Overdue tasks
    const overdueTasks = tasks.filter(t =>
      t.dueDate &&
      t.dueDate < now &&
      t.status !== TaskStatus.DONE
    ).length;

    return res.json({
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionRate,
        overdueTasks,
        avgCompletionTimeHours: Math.round(avgCompletionTime / (1000 * 60 * 60) * 10) / 10,
      },
      charts: {
        tasksByDay: Object.entries(tasksByDay).map(([date, data]) => ({
          date,
          ...data,
        })).sort((a, b) => a.date.localeCompare(b.date)),
        priorityDistribution: Object.entries(priorityDistribution).map(([priority, count]) => ({
          priority,
          count,
        })),
        statusDistribution: [
          { status: 'DONE', count: completedTasks },
          { status: 'IN_PROGRESS', count: inProgressTasks },
          { status: 'TODO', count: pendingTasks },
        ],
      },
    });
  } catch (error) {
    console.error('Productivity analytics error:', error);
    return res.status(500).json({
      error: 'Failed to generate productivity analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/analytics/mood
 * Get mood analytics based on lifelog entries
 */
router.get('/mood', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { timeframe = 'week' } = req.query;

    // Calculate date range
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
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch lifelog entries
    const lifelogs = await prisma.lifelogEntry.findMany({
      where: {
        userId,
        createdAt: { gte: startDate },
        mood: { not: null },
      },
      select: {
        id: true,
        mood: true,
        content: true,
        tags: true,
        createdAt: true,
      },
    });

    // Mood frequency analysis
    const moodFrequency = lifelogs.reduce((acc: Record<string, number>, log) => {
      if (log.mood) {
        acc[log.mood] = (acc[log.mood] || 0) + 1;
      }
      return acc;
    }, {});

    // Mood by day
    const moodByDay = lifelogs.reduce((acc: Record<string, Record<string, number>>, log) => {
      const date = log.createdAt.toISOString().split('T')[0];
      if (!acc[date]) acc[date] = {};
      if (log.mood) {
        acc[date][log.mood] = (acc[date][log.mood] || 0) + 1;
      }
      return acc;
    }, {});

    // Mood trends (simplified)
    const moodEntries = Object.entries(moodFrequency);
    const dominantMood = moodEntries.length > 0
      ? moodEntries.reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'neutral';

    // Tag analysis for mood context
    const moodTagsAnalysis = lifelogs.reduce((acc: Record<string, string[]>, log) => {
      if (log.mood && log.tags.length > 0) {
        if (!acc[log.mood]) acc[log.mood] = [];
        acc[log.mood].push(...log.tags);
      }
      return acc;
    }, {});

    // Most common tags per mood
    const moodTagsFrequency = Object.entries(moodTagsAnalysis).reduce((acc: Record<string, Record<string, number>>, [mood, tags]) => {
      acc[mood] = tags.reduce((tagAcc: Record<string, number>, tag) => {
        tagAcc[tag] = (tagAcc[tag] || 0) + 1;
        return tagAcc;
      }, {});
      return acc;
    }, {});

    return res.json({
      timeframe,
      period: {
        start: startDate.toISOString(),
        end: now.toISOString(),
      },
      overview: {
        totalEntries: lifelogs.length,
        dominantMood,
        moodVariety: Object.keys(moodFrequency).length,
      },
      charts: {
        moodFrequency: Object.entries(moodFrequency).map(([mood, count]) => ({
          mood,
          count,
        })),
        moodByDay: Object.entries(moodByDay).map(([date, moods]) => ({
          date,
          moods: Object.entries(moods).map(([mood, count]) => ({ mood, count })),
        })).sort((a, b) => a.date.localeCompare(b.date)),
        moodTagsContext: Object.entries(moodTagsFrequency).map(([mood, tags]) => ({
          mood,
          topTags: Object.entries(tags)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count })),
        })),
      },
    });
  } catch (error) {
    console.error('Mood analytics error:', error);
    return res.status(500).json({
      error: 'Failed to generate mood analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/v1/analytics/summary
 * Get overall summary analytics
 */
router.get('/summary', authenticateToken, async (req: Request & { user?: any }, res: Response): Promise<Response> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    // Parallel data fetching
    const [tasks, lifelogs, events] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
        select: {
          status: true,
          priority: true,
          createdAt: true,
        },
      }),
      prisma.lifelogEntry.findMany({
        where: {
          userId,
          createdAt: { gte: weekAgo },
        },
        select: {
          mood: true,
          createdAt: true,
        },
      }),
      prisma.calendarEvent.findMany({
        where: {
          userId,
          startTime: { gte: weekAgo },
        },
        select: {
          title: true,
          startTime: true,
          endTime: true,
        },
      }),
    ]);

    // Quick metrics
    const completionRate = tasks.length > 0
      ? Math.round((tasks.filter(t => t.status === TaskStatus.DONE).length / tasks.length) * 100)
      : 0;

    const dominantMood = lifelogs
      .filter(l => l.mood)
      .reduce((acc: Record<string, number>, l) => {
        if (l.mood) acc[l.mood] = (acc[l.mood] || 0) + 1;
        return acc;
      }, {});

    const topMood = Object.entries(dominantMood).length > 0
      ? Object.entries(dominantMood).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'neutral';

    // Activity trend (last 7 days)
    const activityByDay = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - (6 - i));
      const dateStr = date.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t =>
        t.createdAt.toISOString().split('T')[0] === dateStr
      ).length;

      const dayLifelogs = lifelogs.filter(l =>
        l.createdAt.toISOString().split('T')[0] === dateStr
      ).length;

      const dayEvents = events.filter(e =>
        e.startTime.toISOString().split('T')[0] === dateStr
      ).length;

      return {
        date: dateStr,
        tasks: dayTasks,
        lifelogs: dayLifelogs,
        events: dayEvents,
        total: dayTasks + dayLifelogs + dayEvents,
      };
    });

    return res.json({
      period: {
        start: weekAgo.toISOString(),
        end: now.toISOString(),
      },
      summary: {
        tasks: {
          total: tasks.length,
          completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
          completionRate,
        },
        mood: {
          entries: lifelogs.length,
          dominant: topMood,
        },
        events: {
          total: events.length,
          upcoming: events.filter(e => e.startTime > now).length,
        },
        activityTrend: activityByDay,
      },
    });
  } catch (error) {
    console.error('Summary analytics error:', error);
    return res.status(500).json({
      error: 'Failed to generate summary analytics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;