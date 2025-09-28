import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    lifelogEntry: {
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

describe('Lifelog API', () => {
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

  describe('GET /api/v1/lifelog/entries', () => {
    it('should return a list of lifelog entries', async () => {
      const mockEntries = [
        {
          id: 'entry1',
          userId: 'test-user-id',
          content: 'First entry',
          tags: ['test'],
          mood: 'good',
          createdAt: new Date('2025-01-01T10:00:00Z'),
          updatedAt: new Date('2025-01-01T10:00:00Z'),
        },
        {
          id: 'entry2',
          userId: 'test-user-id',
          content: 'Second entry',
          tags: [],
          mood: null,
          createdAt: new Date('2025-01-01T11:00:00Z'),
          updatedAt: new Date('2025-01-01T11:00:00Z'),
        },
      ];

      (prisma.lifelogEntry.findMany as jest.Mock).mockResolvedValue(mockEntries);

      // Import the router after mocking
      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .get('/api/v1/lifelog/entries')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].content).toBe('First entry');
      expect(prisma.lifelogEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        skip: 0,
      });
    });

    it('should support pagination with limit and offset', async () => {
      (prisma.lifelogEntry.findMany as jest.Mock).mockResolvedValue([]);

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      await request(app)
        .get('/api/v1/lifelog/entries?limit=10&offset=20')
        .expect(200);

      expect(prisma.lifelogEntry.findMany).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 20,
      });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.lifelogEntry.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .get('/api/v1/lifelog/entries')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to fetch entries');
    });
  });

  describe('POST /api/v1/lifelog/entries', () => {
    it('should create a new lifelog entry', async () => {
      const newEntry = {
        content: 'New lifelog entry',
        tags: ['work', 'coding'],
        mood: 'great',
      };

      const createdEntry = {
        id: 'new-entry-id',
        userId: 'test-user-id',
        ...newEntry,
        images: [],
        locationLat: null,
        locationLng: null,
        locationName: null,
        createdAt: new Date('2025-01-01T12:00:00Z'),
        updatedAt: new Date('2025-01-01T12:00:00Z'),
      };

      (prisma.lifelogEntry.create as jest.Mock).mockResolvedValue(createdEntry);

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .post('/api/v1/lifelog/entries')
        .send(newEntry)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'new-entry-id');
      expect(response.body).toHaveProperty('content', 'New lifelog entry');
      expect(prisma.lifelogEntry.create).toHaveBeenCalledWith({
        data: {
          ...newEntry,
          userId: 'test-user-id',
        },
      });
    });

    it('should validate content length (max 280 chars)', async () => {
      const longContent = 'a'.repeat(281);

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .post('/api/v1/lifelog/entries')
        .send({ content: longContent })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(prisma.lifelogEntry.create).not.toHaveBeenCalled();
    });

    it('should validate content is required', async () => {
      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .post('/api/v1/lifelog/entries')
        .send({ tags: ['test'] })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(prisma.lifelogEntry.create).not.toHaveBeenCalled();
    });

    it('should validate mood enum values', async () => {
      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .post('/api/v1/lifelog/entries')
        .send({ content: 'Test', mood: 'invalid-mood' })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(prisma.lifelogEntry.create).not.toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      (prisma.lifelogEntry.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .post('/api/v1/lifelog/entries')
        .send({ content: 'Test entry' })
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Failed to create entry');
    });
  });

  describe('PUT /api/v1/lifelog/entries/:id', () => {
    it('should update an existing lifelog entry', async () => {
      const entryId = 'existing-entry-id';
      const updateData = {
        content: 'Updated content',
        mood: 'okay',
      };

      const updatedEntry = {
        id: entryId,
        userId: 'test-user-id',
        ...updateData,
        tags: [],
        images: [],
        locationLat: null,
        locationLng: null,
        locationName: null,
        createdAt: new Date('2025-01-01T10:00:00Z'),
        updatedAt: new Date('2025-01-01T13:00:00Z'),
      };

      (prisma.lifelogEntry.update as jest.Mock).mockResolvedValue(updatedEntry);

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .put(`/api/v1/lifelog/entries/${entryId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('content', 'Updated content');
      expect(response.body).toHaveProperty('mood', 'okay');
      expect(prisma.lifelogEntry.update).toHaveBeenCalledWith({
        where: { id: entryId, userId: 'test-user-id' },
        data: updateData,
      });
    });

    it('should validate update data', async () => {
      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .put('/api/v1/lifelog/entries/some-id')
        .send({ content: 'a'.repeat(281) })
        .expect(400);

      expect(response.body).toHaveProperty('errors');
      expect(prisma.lifelogEntry.update).not.toHaveBeenCalled();
    });

    it('should handle entry not found', async () => {
      (prisma.lifelogEntry.update as jest.Mock).mockRejectedValue(
        new Error('Record to update not found')
      );

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .put('/api/v1/lifelog/entries/non-existent-id')
        .send({ content: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Entry not found');
    });
  });

  describe('DELETE /api/v1/lifelog/entries/:id', () => {
    it('should delete a lifelog entry', async () => {
      const entryId = 'entry-to-delete';

      (prisma.lifelogEntry.delete as jest.Mock).mockResolvedValue({
        id: entryId,
        userId: 'test-user-id',
        content: 'Deleted entry',
      });

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      await request(app)
        .delete(`/api/v1/lifelog/entries/${entryId}`)
        .expect(204);

      expect(prisma.lifelogEntry.delete).toHaveBeenCalledWith({
        where: { id: entryId, userId: 'test-user-id' },
      });
    });

    it('should handle entry not found', async () => {
      (prisma.lifelogEntry.delete as jest.Mock).mockRejectedValue(
        new Error('Record to delete does not exist')
      );

      const lifelogRouter = (await import('../../src/routes/lifelog')).default;
      app.use('/api/v1/lifelog', lifelogRouter);

      const response = await request(app)
        .delete('/api/v1/lifelog/entries/non-existent-id')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Entry not found');
    });
  });
});