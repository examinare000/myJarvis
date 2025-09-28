import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    task: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  })),
}));

const prisma = new PrismaClient();

describe('Tasks API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req: any, res, next) => {
      req.user = { id: 'test-user-id' };
      next();
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/tasks/today', () => {
    it('should return today\'s tasks ordered by priority', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const mockTasks = [
        {
          id: 'task1',
          userId: 'test-user-id',
          title: 'High priority task',
          description: 'Important task',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date('2025-01-01T14:00:00Z'),
          createdAt: new Date('2025-01-01T08:00:00Z'),
          updatedAt: new Date('2025-01-01T08:00:00Z'),
        },
        {
          id: 'task2',
          userId: 'test-user-id',
          title: 'Medium priority task',
          description: 'Regular task',
          status: 'TODO',
          priority: 'MEDIUM',
          dueDate: new Date('2025-01-01T16:00:00Z'),
          createdAt: new Date('2025-01-01T09:00:00Z'),
          updatedAt: new Date('2025-01-01T09:00:00Z'),
        },
        {
          id: 'task3',
          userId: 'test-user-id',
          title: 'Low priority task',
          description: 'Can wait',
          status: 'DONE',
          priority: 'LOW',
          dueDate: new Date('2025-01-01T18:00:00Z'),
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-01-01T10:00:00Z'),
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/today')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].priority).toBe('HIGH');
      expect(response.body[0].title).toBe('High priority task');

      // Verify the Prisma query
      expect(prisma.task.findMany).toHaveBeenCalled();
      const callArgs = (prisma.task.findMany as jest.Mock).mock.calls[0][0];
      expect(callArgs.where.userId).toBe('test-user-id');
      expect(callArgs.where.dueDate).toBeDefined();
      expect(callArgs.orderBy).toEqual([
        { priority: 'desc' },
        { createdAt: 'asc' },
      ]);
    });

    it('should return empty array when no tasks for today', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/today')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should include tasks with different statuses', async () => {
      const mockTasks = [
        {
          id: 'task1',
          userId: 'test-user-id',
          title: 'Todo task',
          status: 'TODO',
          priority: 'HIGH',
          dueDate: new Date(),
        },
        {
          id: 'task2',
          userId: 'test-user-id',
          title: 'In progress task',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
          dueDate: new Date(),
        },
        {
          id: 'task3',
          userId: 'test-user-id',
          title: 'Done task',
          status: 'DONE',
          priority: 'LOW',
          dueDate: new Date(),
        },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/today')
        .expect(200);

      expect(response.body).toHaveLength(3);
      const statuses = response.body.map((task: any) => task.status);
      expect(statuses).toContain('TODO');
      expect(statuses).toContain('IN_PROGRESS');
      expect(statuses).toContain('DONE');
    });

    it('should handle database errors gracefully', async () => {
      (prisma.task.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/today')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch today tasks');
    });
  });

  describe('PUT /api/v1/tasks/:id/status', () => {
    it('should update task status', async () => {
      const taskId = 'task-id';
      const updatedTask = {
        id: taskId,
        userId: 'test-user-id',
        title: 'Task to update',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.task.update as jest.Mock).mockResolvedValue(updatedTask);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}/status`)
        .send({ status: 'DONE' })
        .expect(200);

      expect(response.body).toHaveProperty('status', 'DONE');
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: taskId, userId: 'test-user-id' },
        data: { status: 'DONE' },
      });
    });

    it('should validate status enum values', async () => {
      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .put('/api/v1/tasks/task-id/status')
        .send({ status: 'INVALID_STATUS' })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid status');
      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('should handle task not found', async () => {
      (prisma.task.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found')
      );

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .put('/api/v1/tasks/non-existent-id/status')
        .send({ status: 'DONE' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Task not found');
    });
  });

  describe('GET /api/v1/tasks/stats/today', () => {
    it('should return today\'s task statistics', async () => {
      const mockTasks = [
        { id: '1', status: 'TODO', priority: 'HIGH' },
        { id: '2', status: 'TODO', priority: 'MEDIUM' },
        { id: '3', status: 'IN_PROGRESS', priority: 'HIGH' },
        { id: '4', status: 'DONE', priority: 'LOW' },
        { id: '5', status: 'DONE', priority: 'MEDIUM' },
      ];

      (prisma.task.findMany as jest.Mock).mockResolvedValue(mockTasks);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/stats/today')
        .expect(200);

      expect(response.body).toEqual({
        total: 5,
        todo: 2,
        inProgress: 1,
        done: 2,
        completionRate: 40,
        byPriority: {
          high: 2,
          medium: 2,
          low: 1,
        },
      });
    });

    it('should return zero stats when no tasks', async () => {
      (prisma.task.findMany as jest.Mock).mockResolvedValue([]);

      const tasksRouter = (await import('../../src/routes/tasks')).default;
      app.use('/api/v1/tasks', tasksRouter);

      const response = await request(app)
        .get('/api/v1/tasks/stats/today')
        .expect(200);

      expect(response.body).toEqual({
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        completionRate: 0,
        byPriority: {
          high: 0,
          medium: 0,
          low: 0,
        },
      });
    });
  });
});