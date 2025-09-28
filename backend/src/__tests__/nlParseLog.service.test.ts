import { describe, it, expect, beforeEach } from '@jest/globals';
import prisma from '../lib/prisma';
import { createParseLog, listRecentParseLogs } from '../services/nlParseLogService';
import { ZodError } from 'zod';

const prismaMock = prisma as unknown as {
  nlParseLog: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('nlParseLogService', () => {
  beforeEach(() => {
    prismaMock.nlParseLog.create.mockReset();
    prismaMock.nlParseLog.findMany.mockReset();
  });

  describe('createParseLog', () => {
    it('入力値を正規化してPrismaに保存する', async () => {
      const expected = {
        id: 'log-123',
        userId: 'user-1',
        inputText: 'ミーティングを設定',
        parsedResult: { title: 'ミーティング' },
        confidenceScore: 0.7,
        userAccepted: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      };

      prismaMock.nlParseLog.create.mockResolvedValueOnce(expected);

      const result = await createParseLog({
        userId: 'user-1',
        inputText: '  ミーティングを設定  ',
        parsedResult: { title: 'ミーティング' },
        confidenceScore: 0.7,
        userAccepted: true,
      });

      expect(prismaMock.nlParseLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          inputText: 'ミーティングを設定',
          parsedResult: { title: 'ミーティング' },
          confidenceScore: 0.7,
          userAccepted: true,
        },
      });
      expect(result).toEqual(expected);
    });

    it('信頼度が範囲外の場合は検証エラーを投げる', async () => {
      await expect(
        createParseLog({
          userId: 'user-1',
          inputText: 'invalid',
          confidenceScore: 1.5,
        })
      ).rejects.toBeInstanceOf(ZodError);

      expect(prismaMock.nlParseLog.create).not.toHaveBeenCalled();
    });
  });

  describe('listRecentParseLogs', () => {
    it('既定件数で最新順にログを取得する', async () => {
      const logs = [
        { id: 'log-2', createdAt: new Date('2025-01-02T00:00:00Z') },
        { id: 'log-1', createdAt: new Date('2025-01-01T00:00:00Z') },
      ];
      prismaMock.nlParseLog.findMany.mockResolvedValueOnce(logs);

      const result = await listRecentParseLogs('user-1');

      expect(prismaMock.nlParseLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });
      expect(result).toEqual(logs);
    });

    it('limitが指定された場合は最大件数を制限する', async () => {
      prismaMock.nlParseLog.findMany.mockResolvedValueOnce([]);

      await listRecentParseLogs('user-1', 5);

      expect(prismaMock.nlParseLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 5,
      });
    });

    it('limitが1未満の場合は検証エラーを投げる', async () => {
      await expect(listRecentParseLogs('user-1', 0)).rejects.toBeInstanceOf(ZodError);
      expect(prismaMock.nlParseLog.findMany).not.toHaveBeenCalled();
    });

    it('limitが100を超える場合は100件で取得する', async () => {
      prismaMock.nlParseLog.findMany.mockResolvedValueOnce([]);

      await listRecentParseLogs('user-1', 500);

      expect(prismaMock.nlParseLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    });
  });
});
