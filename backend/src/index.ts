import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// 環境変数を読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// ミドルウェア
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'myJarvis-backend'
  });
});

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

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`myJarvis Backend Server running on port ${PORT}`);
  console.log(`Health check available at: http://localhost:${PORT}/health`);
  console.log(`API info available at: http://localhost:${PORT}/api/v1`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal, shutting down gracefully...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});