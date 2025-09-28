import { ZodError, ZodIssue } from 'zod';

jest.mock('../services/nlParseLogService', () => ({
  createParseLog: jest.fn(),
  listRecentParseLogs: jest.fn(),
}));

const service = jest.requireMock('../services/nlParseLogService');
const nlParseLogRouter = require('../routes/nlParseLog').default;

type Handler = (req: any, res: any, next: any) => Promise<void> | void;

const findHandler = (method: string, path: string): Handler => {
  const layer = nlParseLogRouter.stack.find((l: any) => l.route?.path === path && l.route?.methods?.[method]);
  if (!layer) {
    throw new Error(`Handler not found for ${method.toUpperCase()} ${path}`);
  }
  return layer.route.stack[0].handle;
};

const createMockResponse = () => {
  const res: any = {};
  res.statusCode = 200;
  res.body = undefined;
  res.status = jest.fn(function status(code: number) {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn(function json(payload: any) {
    res.body = payload;
    return res;
  });
  return res;
};

describe('NLP Parse Log API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    const handler = findHandler('post', '/');

    it('解析ログを作成して201を返す', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        inputText: '明日の15時に会議',
        parsedResult: { title: '会議' },
        confidenceScore: 0.9,
        userAccepted: true,
        createdAt: new Date('2025-01-01T00:00:00Z'),
      };

      service.createParseLog.mockResolvedValueOnce(mockLog);

      const req = {
        method: 'POST',
        url: '/',
        body: {
          userId: 'user-1',
          inputText: '明日の15時に会議',
          parsedResult: { title: '会議' },
          confidenceScore: 0.9,
          userAccepted: true,
        },
      };
      const res = createMockResponse();

      await handler(req, res, jest.fn());

      expect(service.createParseLog).toHaveBeenCalledWith(req.body);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockLog });
    });

    it('検証エラー時は400とエラー内容を返す', async () => {
      const issues: ZodIssue[] = [
        {
          code: 'too_small',
          minimum: 1,
          type: 'number',
          inclusive: true,
          exact: false,
          message: '取得件数は1件以上で指定してください',
          path: ['limit'],
        },
      ];

      service.createParseLog.mockRejectedValueOnce(new ZodError(issues));

      const req = {
        method: 'POST',
        url: '/',
        body: {
          userId: '',
          inputText: '',
        },
      };
      const res = createMockResponse();

      await handler(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: '入力値が不正です',
        details: expect.any(Array),
      });
    });
  });

  describe('GET /', () => {
    const handler = findHandler('get', '/');

    it('最新の解析ログを取得する', async () => {
      const logs = [{ id: 'log-1' }, { id: 'log-2' }];
      service.listRecentParseLogs.mockResolvedValueOnce(logs);

      const req = {
        method: 'GET',
        url: '/',
        query: {
          userId: 'user-1',
          limit: '10',
        },
      };
      const res = createMockResponse();

      await handler(req, res, jest.fn());

      expect(service.listRecentParseLogs).toHaveBeenCalledWith('user-1', 10);
      expect(res.statusCode).toBe(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: logs });
    });

    it('ユーザーIDが無い場合は400を返す', async () => {
      const req = {
        method: 'GET',
        url: '/',
        query: {},
      };
      const res = createMockResponse();

      await handler(req, res, jest.fn());

      expect(service.listRecentParseLogs).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ success: false, error: 'userId は必須です' });
    });
  });
});
