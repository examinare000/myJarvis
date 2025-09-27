import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../lib/prisma';

const router = Router();

const packageJsonPath = path.resolve(__dirname, '../../package.json');
let cachedVersion: string | null = null;

function getPackageVersion(): string {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Read synchronously so health checks don't race with startup.
    const raw = fs.readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    cachedVersion = pkg.version ?? 'unknown';
  } catch (error) {
    cachedVersion = 'unknown';
  }

  return cachedVersion;
}

router.get('/health', async (_req, res) => {
  const version = getPackageVersion();
  const timestamp = new Date().toISOString();
  const uptime = process.uptime();

  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      status: 'healthy',
      timestamp,
      uptime,
      service: 'myjarvis-backend',
      version,
      database: {
        connected: true,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    res.status(503).json({
      status: 'unhealthy',
      timestamp,
      uptime,
      service: 'myjarvis-backend',
      version,
      database: {
        connected: false,
        error: message,
      },
    });
  }
});

export default router;
