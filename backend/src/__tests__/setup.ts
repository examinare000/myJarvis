import * as dotenv from 'dotenv';

// テスト用環境変数を読み込み
dotenv.config({ path: '.env.test' });

// グローバルなテストタイムアウト設定
jest.setTimeout(30000);

// Prismaクライアントのモック設定
jest.mock('@prisma/client', () => ({
  Prisma: {
    sql: (strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values }),
  },
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $queryRaw: jest.fn(),
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    task: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    schedule: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    nlParseLog: {
      create: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// テスト後のクリーンアップ
afterAll(async () => {
  await new Promise<void>((resolve) => setTimeout(() => resolve(), 500));
});

export {};
