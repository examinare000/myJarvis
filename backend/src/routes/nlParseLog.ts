import { Router } from 'express';
import { ZodError } from 'zod';
import { createParseLog, listRecentParseLogs } from '../services/nlParseLogService';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const log = await createParseLog(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: '入力値が不正です',
        details: error.errors,
      });
      return;
    }

    console.error('Error creating parse log:', error);
    res.status(500).json({ success: false, error: '解析ログの作成に失敗しました' });
  }
});

router.get('/', async (req, res) => {
  const { userId, limit } = req.query;

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    res.status(400).json({ success: false, error: 'userId は必須です' });
    return;
  }

  let parsedLimit: number | undefined;
  if (typeof limit === 'string' && limit.trim() !== '') {
    const numericLimit = Number(limit);
    if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
      res.status(400).json({ success: false, error: 'limit は正の整数で指定してください' });
      return;
    }
    parsedLimit = Math.floor(numericLimit);
  }

  try {
    const logs = await listRecentParseLogs(userId, parsedLimit);
    res.json({ success: true, data: logs });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ success: false, error: '入力値が不正です', details: error.errors });
      return;
    }

    console.error('Error fetching parse logs:', error);
    res.status(500).json({ success: false, error: '解析ログの取得に失敗しました' });
  }
});

export default router;
