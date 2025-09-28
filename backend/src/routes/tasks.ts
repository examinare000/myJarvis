import { Router } from 'express';
import { PrismaClient, TaskStatus } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']),
});

// GET /api/v1/tasks/today
router.get('/today', async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user?.id || 'test-user',
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching today tasks:', error);
    res.status(500).json({ error: 'Failed to fetch today tasks' });
  }
});

// PUT /api/v1/tasks/:id/status
router.put('/:id/status', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const task = await prisma.task.update({
      where: {
        id,
        userId: req.user?.id || 'test-user',
      },
      data: { status: status as TaskStatus },
    });

    return res.json(task);
  } catch (error) {
    if ((error as any)?.message?.includes('Record to update not found')) {
      return res.status(404).json({ error: 'Task not found' });
    } else {
      console.error('Error updating task status:', error);
      return res.status(500).json({ error: 'Failed to update task status' });
    }
  }
});

// GET /api/v1/tasks/stats/today
router.get('/stats/today', async (req: any, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasks = await prisma.task.findMany({
      where: {
        userId: req.user?.id || 'test-user',
        dueDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const stats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'TODO').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      done: tasks.filter(t => t.status === 'DONE').length,
      completionRate: tasks.length > 0
        ? Math.round((tasks.filter(t => t.status === 'DONE').length / tasks.length) * 100)
        : 0,
      byPriority: {
        high: tasks.filter(t => t.priority === 'HIGH').length,
        medium: tasks.filter(t => t.priority === 'MEDIUM').length,
        low: tasks.filter(t => t.priority === 'LOW').length,
      },
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching task stats:', error);
    res.status(500).json({ error: 'Failed to fetch task stats' });
  }
});

// GET /api/v1/tasks
router.get('/', async (req: any, res) => {
  try {
    const { status, priority, from, to, limit = '50', offset = '0' } = req.query;

    const where: any = { userId: req.user?.id || 'test-user' };

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (from || to) {
      where.dueDate = {};
      if (from) where.dueDate.gte = new Date(from as string);
      if (to) where.dueDate.lte = new Date(to as string);
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: [
        { dueDate: 'asc' },
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: Number(limit),
      skip: Number(offset),
    });

    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/v1/tasks
router.post('/', async (req: any, res) => {
  try {
    const { title, description, priority, dueDate, status } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        status: status || 'TODO',
        userId: req.user?.id || 'test-user',
      },
    });

    return res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/v1/tasks/:id
router.put('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, dueDate, status } = req.body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) updateData.status = status;

    const task = await prisma.task.update({
      where: {
        id,
        userId: req.user?.id || 'test-user',
      },
      data: updateData,
    });

    res.json(task);
  } catch (error) {
    if ((error as any)?.message?.includes('Record to update not found')) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

// DELETE /api/v1/tasks/:id
router.delete('/:id', async (req: any, res) => {
  try {
    const { id } = req.params;

    await prisma.task.delete({
      where: {
        id,
        userId: req.user?.id || 'test-user',
      },
    });

    res.status(204).send();
  } catch (error) {
    if ((error as any)?.message?.includes('Record to delete does not exist')) {
      res.status(404).json({ error: 'Task not found' });
    } else {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
});

export default router;