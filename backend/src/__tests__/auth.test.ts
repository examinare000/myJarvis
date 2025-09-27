import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import authRouter from '../routes/auth';
import prisma from '../lib/prisma';

type PrismaUserMock = {
  findUnique: jest.Mock;
  create: jest.Mock;
};

type PrismaMock = {
  user: PrismaUserMock;
};

const prismaMock = prisma as unknown as PrismaMock;

describe('Authentication API', () => {
  let app: express.Application;

  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_ACCESS_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', authRouter);

    prismaMock.user.findUnique.mockReset();
    prismaMock.user.create.mockReset();
  });

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user and returns tokens', async () => {
      const newUser = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      prismaMock.user.create.mockResolvedValueOnce({
        id: 'user-1',
        email: newUser.email,
        name: newUser.name,
        passwordHash: 'hashed-password',
        createdAt: new Date('2024-01-01T00:00:00.000Z'),
        updatedAt: new Date('2024-01-01T00:00:00.000Z'),
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        id: 'user-1',
        email: newUser.email,
        name: newUser.name,
      });
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');

      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: newUser.email,
          name: newUser.name,
          passwordHash: expect.any(String),
        }),
      });
    });

    it('rejects registration with invalid email', async () => {
      const invalidUser = {
        email: 'invalid-email',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('email');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('rejects registration with weak password', async () => {
      const weakPasswordUser = {
        email: 'test@example.com',
        password: '123',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(weakPasswordUser);

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('password');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it('rejects duplicate email registration', async () => {
      const user = {
        email: 'duplicate@example.com',
        password: 'SecurePassword123!',
        name: 'Test User',
      };

      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-dup',
        email: user.email,
        name: user.name,
        passwordHash: 'hashed',
      });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(user);

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already exists');
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with valid credentials and returns tokens', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'SecurePassword123!',
      };

      const passwordHash = await bcrypt.hash(credentials.password, 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: credentials.email,
        name: 'Test User',
        passwordHash,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials)
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: 'user-1',
        email: credentials.email,
        name: 'Test User',
      });
      expect(typeof response.body.accessToken).toBe('string');
      expect(typeof response.body.refreshToken).toBe('string');
    });

    it('rejects login with invalid email', async () => {
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'SecurePassword123!',
      };

      prismaMock.user.findUnique.mockResolvedValueOnce(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });

    it('rejects login with wrong password', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      };

      const passwordHash = await bcrypt.hash('SecurePassword123!', 10);
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: credentials.email,
        name: 'Test User',
        passwordHash,
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(credentials);

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid credentials');
    });
  });
});
