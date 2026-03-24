import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, AuthUser } from '../types';

const DEV_USER: AuthUser = {
  id: 'dev-user-001',
  email: 'dev@blockbuster.local',
  displayName: 'Dev User',
};

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // SKIP_AUTH is only allowed outside production
  const skipAuth = process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV !== 'production';
  if (process.env.SKIP_AUTH === 'true' && process.env.NODE_ENV === 'production') {
    console.warn('[security] SKIP_AUTH is ignored in production mode');
  }

  if (skipAuth) {
    req.user = DEV_USER;
    next();
    return;
  }

  const token = req.cookies?.token as string | undefined;

  if (!token) {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      },
    });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] }) as AuthUser;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName,
    };
    next();
  } catch {
    res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token.',
      },
    });
  }
}
