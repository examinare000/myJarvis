import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JWTPayload } from '../services/jwtService';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

/**
 * JWT認証ミドルウェア
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        error: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    const payload: JWTPayload = verifyAccessToken(token);

    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(403).json({
      error: 'Invalid or expired token',
      code: 'TOKEN_INVALID'
    });
  }
};

/**
 * 管理者権限チェックミドルウェア
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED'
    });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      error: 'Admin privileges required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }

  return next();
};

/**
 * オプショナル認証ミドルウェア（認証があれば使用、なくても通す）
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload: JWTPayload = verifyAccessToken(token);
      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
      };
    }

    return next();
  } catch (error) {
    // 認証エラーでも通す（トークンは無視）
    return next();
  }
};
