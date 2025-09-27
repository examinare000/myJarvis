import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../lib/prisma';

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string;
  [key: string]: unknown;
};

const router = Router();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeUser = (user: AuthenticatedUser) => {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};

const requireEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not configured`);
  }

  return value;
};

const generateTokens = (user: AuthenticatedUser) => {
  const accessSecret = requireEnv('JWT_SECRET');
  const refreshSecret = requireEnv('JWT_REFRESH_SECRET');
  const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

  const payload = { sub: user.id, email: user.email, name: user.name };
  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: accessExpiresIn } as SignOptions);
  const refreshToken = jwt.sign({ ...payload, type: 'refresh' }, refreshSecret, {
    expiresIn: refreshExpiresIn,
  } as SignOptions);

  return { accessToken, refreshToken };
};

const isValidEmail = (email: unknown): email is string => typeof email === 'string' && EMAIL_REGEX.test(email);

const isStrongPassword = (password: unknown): password is string =>
  typeof password === 'string' &&
  password.length >= 8 &&
  /[a-z]/.test(password) &&
  /[A-Z]/.test(password) &&
  /\d/.test(password);

router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body as {
      email?: unknown;
      password?: unknown;
      name?: unknown;
    };

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'email is invalid' });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ error: 'password must be at least 8 characters long and include upper and lower case letters and a number' });
    }

    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const createdUser = (await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
      },
    })) as AuthenticatedUser;

    const { accessToken, refreshToken } = generateTokens(createdUser);

    return res.status(201).json({
      user: sanitizeUser(createdUser),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ error: message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body as {
      email?: unknown;
      password?: unknown;
    };

    if (!isValidEmail(email) || typeof password !== 'string') {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = (await prisma.user.findUnique({ where: { email } })) as AuthenticatedUser | null;

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return res.status(200).json({
      user: sanitizeUser(user),
      accessToken,
      refreshToken,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return res.status(500).json({ error: message });
  }
});

export default router;
