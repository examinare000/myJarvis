import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('LifelogEntry Model', () => {
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
    await prisma.lifelogEntry.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.delete({
      where: { id: testUserId },
    });
  });

  describe('Create', () => {
    it('should create a lifelog entry with required fields', async () => {
      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'This is a test lifelog entry',
        },
      });

      expect(entry).toBeDefined();
      expect(entry.id).toBeTruthy();
      expect(entry.content).toBe('This is a test lifelog entry');
      expect(entry.userId).toBe(testUserId);
      expect(entry.createdAt).toBeInstanceOf(Date);
      expect(entry.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a lifelog entry with optional fields', async () => {
      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'Test with tags and mood',
          tags: ['work', 'coding'],
          mood: 'good',
        },
      });

      expect(entry.tags).toEqual(['work', 'coding']);
      expect(entry.mood).toBe('good');
    });

    it('should enforce 280 character limit on content', async () => {
      const longContent = 'a'.repeat(281);

      await expect(
        prisma.lifelogEntry.create({
          data: {
            userId: testUserId,
            content: longContent,
          },
        })
      ).rejects.toThrow();
    });

    it('should allow exactly 280 characters', async () => {
      const maxContent = 'a'.repeat(280);

      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: maxContent,
        },
      });

      expect(entry.content).toHaveLength(280);
    });
  });

  describe('Read', () => {
    it('should retrieve lifelog entries by userId', async () => {
      // 複数エントリを作成
      await prisma.lifelogEntry.createMany({
        data: [
          { userId: testUserId, content: 'Entry 1' },
          { userId: testUserId, content: 'Entry 2' },
          { userId: testUserId, content: 'Entry 3' },
        ],
      });

      const entries = await prisma.lifelogEntry.findMany({
        where: { userId: testUserId },
        orderBy: { createdAt: 'desc' },
      });

      expect(entries).toHaveLength(3);
      expect(entries[0].content).toMatch(/Entry \d/);
    });

    it('should filter entries by tags', async () => {
      await prisma.lifelogEntry.createMany({
        data: [
          { userId: testUserId, content: 'Work entry', tags: ['work'] },
          { userId: testUserId, content: 'Personal entry', tags: ['personal'] },
          { userId: testUserId, content: 'Both', tags: ['work', 'personal'] },
        ],
      });

      const workEntries = await prisma.lifelogEntry.findMany({
        where: {
          userId: testUserId,
          tags: { has: 'work' },
        },
      });

      expect(workEntries).toHaveLength(2);
    });
  });

  describe('Update', () => {
    it('should update lifelog entry content', async () => {
      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'Original content',
        },
      });

      const updated = await prisma.lifelogEntry.update({
        where: { id: entry.id },
        data: { content: 'Updated content' },
      });

      expect(updated.content).toBe('Updated content');
      expect(updated.updatedAt.getTime()).toBeGreaterThan(entry.updatedAt.getTime());
    });

    it('should add tags to existing entry', async () => {
      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'Test entry',
          tags: ['initial'],
        },
      });

      const updated = await prisma.lifelogEntry.update({
        where: { id: entry.id },
        data: { tags: { push: 'new-tag' } },
      });

      expect(updated.tags).toContain('initial');
      expect(updated.tags).toContain('new-tag');
    });
  });

  describe('Delete', () => {
    it('should delete a lifelog entry', async () => {
      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: testUserId,
          content: 'To be deleted',
        },
      });

      await prisma.lifelogEntry.delete({
        where: { id: entry.id },
      });

      const deleted = await prisma.lifelogEntry.findUnique({
        where: { id: entry.id },
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

      const entry = await prisma.lifelogEntry.create({
        data: {
          userId: user.id,
          content: 'Should be cascade deleted',
        },
      });

      await prisma.user.delete({
        where: { id: user.id },
      });

      const deletedEntry = await prisma.lifelogEntry.findUnique({
        where: { id: entry.id },
      });

      expect(deletedEntry).toBeNull();
    });
  });
});