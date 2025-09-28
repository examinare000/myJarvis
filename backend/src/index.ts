import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import aiRouter from './routes/ai';
import tasksRouter from './routes/tasks';
import lifelogRouter from './routes/lifelog';
import calendarRouter from './routes/calendar';
import nlParseLogRouter from './routes/nlParseLog';
import prisma from './lib/prisma';
import { initializeWebSocket } from './lib/websocket';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ミドルウェア
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/ai', aiRouter);
app.use('/api/v1/tasks', tasksRouter);
app.use('/api/v1/lifelog', lifelogRouter);
app.use('/api/v1/calendar', calendarRouter);
app.use('/api/v1/nlp/parse-logs', nlParseLogRouter);

// API情報エンドポイント
app.get('/api/v1', (req, res) => {
  res.json({
    message: 'myJarvis API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// データベース接続テスト
app.get('/api/v1/db-test', async (req, res) => {
  try {
    // 単純なクエリでデータベース接続をテスト
    await prisma.$queryRaw`SELECT 1 as test`;
    res.json({
      status: 'success',
      message: 'Database connection is working',
      database: 'SQLite'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found'
  });
});

// エラーハンドラー
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error'
  });
});

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`myJarvis Backend Server running on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/api/v1/health`);
    console.log(`API info available at: http://localhost:${PORT}/api/v1`);
  });

  initializeWebSocket(server);

  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

export default app;
