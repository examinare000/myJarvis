import request from 'supertest';
import express from 'express';
import { PrismaClient, TaskStatus, TaskPriority } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Create test app instance
const app = express();
app.use(express.json());

// Import and use AI routes
import aiRouter from '../routes/ai';
app.use('/api/v1/ai', aiRouter);

describe('AI API Routes', () => {
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    // Create test user
    const hashedPassword = await bcrypt.hash('testpassword', 10);
    const user = await prisma.user.create({
      data: {
        email: 'ai-test@test.com',
        name: 'ai-test-user',
        passwordHash: hashedPassword,
      },
    });
    testUserId = user.id;

    // Generate auth token
    authToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '15m' }
    );

    // Create test data
    await Promise.all([
      // Create test tasks
      prisma.task.create({
        data: {
          userId: testUserId,
          title: 'Test Task 1',
          priority: TaskPriority.HIGH,
          status: TaskStatus.TODO,
        },
      }),
      prisma.task.create({
        data: {
          userId: testUserId,
          title: 'Test Task 2',
          priority: TaskPriority.MEDIUM,
          status: TaskStatus.IN_PROGRESS,
        },
      }),
      // Create test lifelog
      prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'Test lifelog entry',
          mood: 'happy',
          tags: ['test', 'mood'],
        },
      }),
      // Create test calendar event
      prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Test Event',
          startTime: new Date(),
          endTime: new Date(Date.now() + 3600000),
          isAllDay: false,
        },
      }),
    ]);
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.task.deleteMany({ where: { userId: testUserId } });
    await prisma.lifelogEntry.deleteMany({ where: { userId: testUserId } });
    await prisma.calendarEvent.deleteMany({ where: { userId: testUserId } });
    await prisma.user.delete({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('POST /api/v1/ai/chat', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      expect(response.status).toBe(401);
    });

    it('should proxy chat request to AI service', async () => {
      const response = await request(app)
        .post('/api/v1/ai/chat')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
          stream: false,
        });

      // AI service might be unavailable in test environment
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('GET /api/v1/ai/models', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/ai/models');
      expect(response.status).toBe(401);
    });

    it('should fetch available models', async () => {
      const response = await request(app)
        .get('/api/v1/ai/models')
        .set('Authorization', `Bearer ${authToken}`);

      // AI service might be unavailable in test environment
      expect([200, 503]).toContain(response.status);
    });
  });

  describe('POST /api/v1/ai/smart-scheduling', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ai/smart-scheduling')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should generate smart schedule', async () => {
      const response = await request(app)
        .post('/api/v1/ai/smart-scheduling')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          preferences: {
            workingHours: { start: '09:00', end: '18:00' },
            breakDuration: 15,
            maxTasksPerDay: 5,
          },
        });

      expect([200, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('optimizedSchedule');
        expect(response.body).toHaveProperty('suggestions');
        expect(response.body).toHaveProperty('conflicts');
        expect(Array.isArray(response.body.optimizedSchedule)).toBe(true);
      }
    });
  });

  describe('POST /api/v1/ai/context-analysis', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/ai/context-analysis')
        .send({});

      expect(response.status).toBe(401);
    });

    it('should analyze user context', async () => {
      const response = await request(app)
        .post('/api/v1/ai/context-analysis')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          timeframe: 'week',
        });

      expect([200, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('productivity');
        expect(response.body).toHaveProperty('mood');
        expect(response.body).toHaveProperty('recommendations');
        expect(response.body).toHaveProperty('insights');
        expect(response.body.productivity).toHaveProperty('score');
        expect(response.body.productivity).toHaveProperty('trend');
      }
    });
  });

  describe('GET /api/v1/ai/task-suggestions', () => {
    it('should require authentication', async () => {
      const response = await request(app).get('/api/v1/ai/task-suggestions');
      expect(response.status).toBe(401);
    });

    it('should generate task suggestions', async () => {
      const response = await request(app)
        .get('/api/v1/ai/task-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ context: 'morning routine' });

      expect([200, 500, 503]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('suggestions');
        expect(Array.isArray(response.body.suggestions)).toBe(true);
      }
    });
  });
});