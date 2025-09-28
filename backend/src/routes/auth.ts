import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { generateTokenPair, verifyRefreshToken, revokeRefreshToken } from '../services/jwtService';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = express.Router();

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上である必要があります'),
  name: z.string().min(1, '名前を入力してください').optional(),
});

const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'リフレッシュトークンが必要です'),
});

/**
 * ユーザー登録
 */
router.post('/register', async (req, res) => {
  try {
    const validation = registerSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.error.errors,
      });
    }

    const { email, password, name } = validation.data;

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists',
        code: 'USER_EXISTS',
      });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);

    // ユーザー作成
    const createdUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: 'USER',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    // トークン生成
    const tokenPayload = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name ?? undefined,
      role: createdUser.role,
    };

    const tokens = await generateTokenPair(tokenPayload);

    return res.status(201).json({
      user: createdUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED',
    });
  }
});

/**
 * ユーザーログイン
 */
router.post('/login', async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.error.errors,
      });
    }

    const { email, password } = validation.data;

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user || !user.passwordHash) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // 最終ログイン時刻更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // トークン生成
    const tokens = await generateTokenPair({
      id: user.id,
      email: user.email,
      name: user.name ?? undefined,
      role: user.role ?? 'USER',
    });

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role ?? 'USER',
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_FAILED',
    });
  }
});

/**
 * トークンリフレッシュ
 */
router.post('/refresh', async (req, res) => {
  try {
    const validation = refreshSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid input',
        details: validation.error.errors,
      });
    }

    const { refreshToken } = validation.data;

    const newTokens = await verifyRefreshToken(refreshToken);

    return res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      message: 'Tokens refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN',
    });
  }
});

/**
 * ログアウト
 */
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return res.json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      error: 'Logout failed',
      code: 'LOGOUT_FAILED',
    });
  }
});

/**
 * 現在のユーザー情報取得
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found',
        code: 'USER_NOT_FOUND',
      });
    }

    return res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({
      error: 'Failed to get user info',
      code: 'GET_USER_FAILED',
    });
  }
});

export default router;
