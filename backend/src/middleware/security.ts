import { Request, Response, NextFunction } from 'express';

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  const isLocalhost = req.hostname === 'localhost' || req.hostname === '127.0.0.1';

  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "media-src 'self' blob:",
    "img-src 'self' data: blob:",
    "connect-src 'self' ws://localhost:* wss://localhost:*",
    "font-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "worker-src 'self' blob:",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ];

  if (!isLocalhost) {
    cspDirectives.push('upgrade-insecure-requests');
  }

  res.setHeader('Content-Security-Policy', cspDirectives.join('; '));

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  next();
}
