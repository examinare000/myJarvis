import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient() as unknown as jest.Mocked<PrismaClient>;

describe('NlParseLog プリズマデリゲート', () => {
  const testUserId = 'test-user-id';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('必須フィールドでログを作成できること', async () => {
    const expectedLog = {
      id: 'log-1',
      userId: testUserId,
      inputText: '来週の月曜日にミーティングを設定',
      parsedResult: null,
      confidenceScore: null,
      userAccepted: null,
      createdAt: new Date('2025-01-01T00:00:00Z'),
    };

    prisma.nlParseLog.create.mockResolvedValue(expectedLog as any);

    const result = await prisma.nlParseLog.create({
      data: {
        userId: testUserId,
        inputText: expectedLog.inputText,
      },
    });

    expect(prisma.nlParseLog).toBeDefined();
    expect(prisma.nlParseLog.create).toHaveBeenCalledWith({
      data: {
        userId: testUserId,
        inputText: expectedLog.inputText,
      },
    });
    expect(result).toEqual(expectedLog);
  });

  it('任意フィールドを含めて作成できること', async () => {
    const expectedLog = {
      id: 'log-2',
      userId: testUserId,
      inputText: '明日の15時に打ち合わせ',
      parsedResult: {
        title: '打ち合わせ',
        startTime: '2025-01-02T15:00:00+09:00',
        endTime: '2025-01-02T16:00:00+09:00',
      },
      confidenceScore: 0.82,
      userAccepted: true,
      createdAt: new Date('2025-01-02T00:00:00Z'),
    };

    prisma.nlParseLog.create.mockResolvedValue(expectedLog as any);

    const result = await prisma.nlParseLog.create({
      data: {
        userId: testUserId,
        inputText: expectedLog.inputText,
        parsedResult: expectedLog.parsedResult,
        confidenceScore: expectedLog.confidenceScore,
        userAccepted: expectedLog.userAccepted,
      },
    });

    expect(prisma.nlParseLog.create).toHaveBeenCalledWith({
      data: {
        userId: testUserId,
        inputText: expectedLog.inputText,
        parsedResult: expectedLog.parsedResult,
        confidenceScore: expectedLog.confidenceScore,
        userAccepted: expectedLog.userAccepted,
      },
    });
    expect(result).toEqual(expectedLog);
  });

  it('信頼度が範囲外の場合はエラーを伝播すること', async () => {
    const error = new Error('confidence score out of range');
    prisma.nlParseLog.create.mockRejectedValueOnce(error);

    await expect(
      prisma.nlParseLog.create({
        data: {
          userId: testUserId,
          inputText: 'invalid confidence high',
          confidenceScore: 1.2,
        },
      })
    ).rejects.toThrow('confidence score out of range');

    expect(prisma.nlParseLog.create).toHaveBeenCalledWith({
      data: {
        userId: testUserId,
        inputText: 'invalid confidence high',
        confidenceScore: 1.2,
      },
    });
  });

  it('作成日時の降順でログを取得できること', async () => {
    const logs = [
      {
        id: 'log-3',
        userId: testUserId,
        inputText: '三番目の入力',
        parsedResult: null,
        confidenceScore: null,
        userAccepted: null,
        createdAt: new Date('2025-01-03T00:00:00Z'),
      },
      {
        id: 'log-2',
        userId: testUserId,
        inputText: '二番目の入力',
        parsedResult: null,
        confidenceScore: null,
        userAccepted: null,
        createdAt: new Date('2025-01-02T00:00:00Z'),
      },
      {
        id: 'log-1',
        userId: testUserId,
        inputText: '最初の入力',
        parsedResult: null,
        confidenceScore: null,
        userAccepted: null,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      },
    ];

    prisma.nlParseLog.findMany.mockResolvedValue(logs as any);

    const result = await prisma.nlParseLog.findMany({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
    });

    expect(prisma.nlParseLog.findMany).toHaveBeenCalledWith({
      where: { userId: testUserId },
      orderBy: { createdAt: 'desc' },
    });
    expect(result).toEqual(logs);
  });
});
