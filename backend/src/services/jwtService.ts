import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserTokenData {
  id: string;
  email: string;
  name?: string;
  role: string;
}

// JWT設定
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

/**
 * アクセストークンとリフレッシュトークンのペアを生成
 */
export async function generateTokenPair(user: UserTokenData): Promise<TokenPair> {
  // アクセストークン生成
  const jti = crypto.randomUUID();
  const accessToken = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      jti,
    },
    JWT_SECRET,
    {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: 'myjarvis',
      audience: 'myjarvis-frontend',
    }
  );

  // リフレッシュトークン生成
  const refreshTokenValue = crypto.randomBytes(32).toString('hex');
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7); // 7日後

  // リフレッシュトークンをデータベースに保存
  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: refreshTokenExpiry,
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
  };
}

/**
 * アクセストークンを検証
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: 'myjarvis',
      audience: 'myjarvis-frontend',
    }) as JWTPayload;

    return payload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
}

/**
 * リフレッシュトークンを検証し、新しいトークンペアを生成
 */
export async function verifyRefreshToken(refreshToken: string): Promise<TokenPair> {
  try {
    // データベースからリフレッシュトークンを取得
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw new Error('Refresh token not found');
    }

    // 有効期限チェック
    if (storedToken.expiresAt < new Date()) {
      // 期限切れトークンを削除
      await prisma.refreshToken.delete({
        where: { id: storedToken.id },
      });
      throw new Error('Refresh token expired');
    }

    // 古いリフレッシュトークンを削除
    await prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // 新しいトークンペアを生成
    const newTokenPair = await generateTokenPair(storedToken.user);

    return newTokenPair;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
}

/**
 * ユーザーの全リフレッシュトークンを無効化（ログアウト全デバイス）
 */
export async function revokeAllRefreshTokens(userId: string): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
}

/**
 * 特定のリフレッシュトークンを無効化
 */
export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  await prisma.refreshToken.delete({
    where: { token: refreshToken },
  });
}

/**
 * 期限切れのリフレッシュトークンをクリーンアップ
 */
export async function cleanupExpiredTokens(): Promise<void> {
  await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
}