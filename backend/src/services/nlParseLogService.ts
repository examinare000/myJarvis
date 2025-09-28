import { Prisma } from '@prisma/client';
import { z } from 'zod';
import prisma from '../lib/prisma';

const createParseLogSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です').trim(),
  inputText: z.string().trim().min(1, '入力テキストは必須です'),
  parsedResult: z.any().optional(),
  confidenceScore: z
    .number({ invalid_type_error: '信頼度は数値で指定してください' })
    .min(0, '信頼度は0以上で指定してください')
    .max(1, '信頼度は1以下で指定してください')
    .optional(),
  userAccepted: z.boolean().optional(),
});

const listRecentParseLogsSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です').trim(),
  limit: z
    .number({ invalid_type_error: '取得件数は数値で指定してください' })
    .int('取得件数は整数で指定してください')
    .min(1, '取得件数は1件以上で指定してください')
    .optional(),
});

export type CreateParseLogInput = z.infer<typeof createParseLogSchema>;

export async function createParseLog(input: CreateParseLogInput) {
  const data = createParseLogSchema.parse(input);

  const parsedResultValue =
    data.parsedResult === null
      ? Prisma.JsonNull
      : (data.parsedResult as Prisma.InputJsonValue | undefined);

  const createData: Prisma.NlParseLogUncheckedCreateInput = {
    userId: data.userId,
    inputText: data.inputText,
    parsedResult: parsedResultValue,
    confidenceScore: data.confidenceScore,
    userAccepted: data.userAccepted,
  };

  return prisma.nlParseLog.create({
    data: createData,
  });
}

export async function listRecentParseLogs(userId: string, limit?: number) {
  const result = listRecentParseLogsSchema.parse({ userId, limit });
  const take = Math.min(result.limit ?? 20, 100);

  return prisma.nlParseLog.findMany({
    where: { userId: result.userId },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
