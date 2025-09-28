import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('CalendarEvent Model', () => {
  let testUserId: string;

  beforeEach(async () => {
    // テスト用ユーザー作成
    const user = await prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        passwordHash: 'hashed_password',
      },
    });
    testUserId = user.id;
  });

  afterEach(async () => {
    // テストデータクリーンアップ
    await prisma.calendarEvent.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('Create', () => {
    it('should create a calendar event with required fields', async () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');

      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Test Meeting',
          startTime,
          endTime,
        },
      });

      expect(event).toBeDefined();
      expect(event.id).toBeTruthy();
      expect(event.title).toBe('Test Meeting');
      expect(event.userId).toBe(testUserId);
      expect(event.startTime).toEqual(startTime);
      expect(event.endTime).toEqual(endTime);
      expect(event.category).toBe('general'); // default value
      expect(event.color).toBe('#1976D2'); // default value
    });

    it('should create a calendar event with optional fields', async () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');

      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Conference',
          description: 'Annual tech conference',
          startTime,
          endTime,
          category: 'work',
          color: '#FF5722',
          location: 'Tokyo Convention Center',
          isAllDay: false,
          recurrenceRule: 'FREQ=WEEKLY;BYDAY=MO',
        },
      });

      expect(event.description).toBe('Annual tech conference');
      expect(event.category).toBe('work');
      expect(event.color).toBe('#FF5722');
      expect(event.location).toBe('Tokyo Convention Center');
      expect(event.isAllDay).toBe(false);
      expect(event.recurrenceRule).toBe('FREQ=WEEKLY;BYDAY=MO');
    });

    it('should create an all-day event', async () => {
      const startTime = new Date('2025-01-01T00:00:00Z');
      const endTime = new Date('2025-01-01T23:59:59Z');

      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Holiday',
          startTime,
          endTime,
          isAllDay: true,
        },
      });

      expect(event.isAllDay).toBe(true);
    });

    it('should validate that end time is after start time', async () => {
      const startTime = new Date('2025-01-01T11:00:00Z');
      const endTime = new Date('2025-01-01T10:00:00Z'); // Invalid: end before start

      await expect(
        prisma.calendarEvent.create({
          data: {
            userId: testUserId,
            title: 'Invalid Event',
            startTime,
            endTime,
          },
        })
      ).rejects.toThrow();
    });

    it('should validate color format', async () => {
      const startTime = new Date('2025-01-01T10:00:00Z');
      const endTime = new Date('2025-01-01T11:00:00Z');

      // Valid hex color
      const validEvent = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Valid Color Event',
          startTime,
          endTime,
          color: '#ABCDEF',
        },
      });
      expect(validEvent.color).toBe('#ABCDEF');

      // Invalid hex color
      await expect(
        prisma.calendarEvent.create({
          data: {
            userId: testUserId,
            title: 'Invalid Color Event',
            startTime,
            endTime,
            color: 'not-a-hex-color',
          },
        })
      ).rejects.toThrow();
    });
  });

  describe('Read', () => {
    it('should retrieve events by date range', async () => {
      const events = [
        {
          userId: testUserId,
          title: 'Morning Meeting',
          startTime: new Date('2025-01-15T09:00:00Z'),
          endTime: new Date('2025-01-15T10:00:00Z'),
        },
        {
          userId: testUserId,
          title: 'Lunch',
          startTime: new Date('2025-01-15T12:00:00Z'),
          endTime: new Date('2025-01-15T13:00:00Z'),
        },
        {
          userId: testUserId,
          title: 'Next Week Meeting',
          startTime: new Date('2025-01-22T09:00:00Z'),
          endTime: new Date('2025-01-22T10:00:00Z'),
        },
      ];

      await prisma.calendarEvent.createMany({ data: events });

      // Query events for January 15
      const dayStart = new Date('2025-01-15T00:00:00Z');
      const dayEnd = new Date('2025-01-15T23:59:59Z');

      const dayEvents = await prisma.calendarEvent.findMany({
        where: {
          userId: testUserId,
          startTime: { gte: dayStart },
          endTime: { lte: dayEnd },
        },
        orderBy: { startTime: 'asc' },
      });

      expect(dayEvents).toHaveLength(2);
      expect(dayEvents[0].title).toBe('Morning Meeting');
      expect(dayEvents[1].title).toBe('Lunch');
    });

    it('should retrieve events by category', async () => {
      await prisma.calendarEvent.createMany({
        data: [
          {
            userId: testUserId,
            title: 'Work Event',
            startTime: new Date('2025-01-01T10:00:00Z'),
            endTime: new Date('2025-01-01T11:00:00Z'),
            category: 'work',
          },
          {
            userId: testUserId,
            title: 'Personal Event',
            startTime: new Date('2025-01-01T14:00:00Z'),
            endTime: new Date('2025-01-01T15:00:00Z'),
            category: 'personal',
          },
        ],
      });

      const workEvents = await prisma.calendarEvent.findMany({
        where: {
          userId: testUserId,
          category: 'work',
        },
      });

      expect(workEvents).toHaveLength(1);
      expect(workEvents[0].title).toBe('Work Event');
    });
  });

  describe('Update', () => {
    it('should update event time', async () => {
      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Movable Event',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      const newStartTime = new Date('2025-01-01T14:00:00Z');
      const newEndTime = new Date('2025-01-01T15:00:00Z');

      const updated = await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          startTime: newStartTime,
          endTime: newEndTime,
        },
      });

      expect(updated.startTime).toEqual(newStartTime);
      expect(updated.endTime).toEqual(newEndTime);
    });

    it('should update event details', async () => {
      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'Original Title',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      const updated = await prisma.calendarEvent.update({
        where: { id: event.id },
        data: {
          title: 'Updated Title',
          description: 'Added description',
          location: 'New Location',
          category: 'work',
        },
      });

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Added description');
      expect(updated.location).toBe('New Location');
      expect(updated.category).toBe('work');
    });
  });

  describe('Delete', () => {
    it('should delete a calendar event', async () => {
      const event = await prisma.calendarEvent.create({
        data: {
          userId: testUserId,
          title: 'To be deleted',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      await prisma.calendarEvent.delete({
        where: { id: event.id },
      });

      const deleted = await prisma.calendarEvent.findUnique({
        where: { id: event.id },
      });

      expect(deleted).toBeNull();
    });

    it('should cascade delete when user is deleted', async () => {
      const user = await prisma.user.create({
        data: {
          email: `cascade-test-${Date.now()}@example.com`,
          name: 'Cascade Test User',
          passwordHash: 'hashed',
        },
      });

      const event = await prisma.calendarEvent.create({
        data: {
          userId: user.id,
          title: 'Should be cascade deleted',
          startTime: new Date('2025-01-01T10:00:00Z'),
          endTime: new Date('2025-01-01T11:00:00Z'),
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const deletedEvent = await prisma.calendarEvent.findUnique({
        where: { id: event.id },
      });

      expect(deletedEvent).toBeNull();
    });
  });
});