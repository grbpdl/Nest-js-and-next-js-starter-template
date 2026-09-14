import { Request } from 'express';

/**
 * Resolves access JWT for browser (cookie) or mobile (Authorization: Bearer).
 * Bearer takes precedence when both are present.
 */
export function extractAccessToken(request: Request): string | null {
  const header = request.headers?.authorization;
  if (typeof header === 'string') {
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token?.trim()) {
      return token.trim();
    }
  }

  const cookieToken = request.cookies?.access_token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}

/**
 * Resolves refresh JWT from body, cookie, or `X-Refresh-Token` header (mobile).
 */
export function extractRefreshToken(
  request: Request,
  bodyToken?: string,
): string | null {
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }

  const header = request.headers?.['x-refresh-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }

  const cookieToken = request.cookies?.refresh_token;
  if (typeof cookieToken === 'string' && cookieToken.trim()) {
    return cookieToken.trim();
  }

  return null;
}
