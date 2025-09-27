jest.mock('../lib/prisma', () => ({
  __esModule: true,
  default: {
    $queryRaw: jest.fn(),
  },
}));

import request from 'supertest';
import app from '../index';
import prisma from '../lib/prisma';

const prismaMock = prisma as unknown as { $queryRaw: jest.Mock };

describe('Health Check Endpoint', () => {
  beforeEach(() => {
    prismaMock.$queryRaw.mockReset();
    prismaMock.$queryRaw.mockResolvedValue(undefined);
  });

  describe('GET /api/v1/health', () => {
    it('should return 200 OK with health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.uptime).toBe('number');
    });

    it('should include service and version information', async () => {
      const response = await request(app).get('/api/v1/health');
      const { version } = require('../../package.json') as { version: string };

      expect(response.body.service).toBe('myjarvis-backend');
      expect(response.body.version).toBe(version);
    });

    it('should include database connectivity status', async () => {
      const response = await request(app).get('/api/v1/health');

      expect(prismaMock.$queryRaw).toHaveBeenCalledTimes(1);
      expect(response.body.database).toEqual({ connected: true });
    });

    it('should return 503 when the database check fails', async () => {
      prismaMock.$queryRaw.mockRejectedValueOnce(new Error('connection failed'));

      const response = await request(app)
        .get('/api/v1/health')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('unhealthy');
      expect(response.body.database).toMatchObject({
        connected: false,
        error: 'connection failed',
      });
    });
  });
});
