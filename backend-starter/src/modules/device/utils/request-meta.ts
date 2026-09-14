import { Request } from 'express';

export function getClientIp(req: {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
}): string {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '';
}

export function getUserAgent(req: {
  headers?: Record<string, string | string[] | undefined>;
}): string | undefined {
  const ua = req.headers?.['user-agent'];
  if (typeof ua === 'string') return ua;
  if (Array.isArray(ua)) return ua[0];
  return undefined;
}

export type RequestMeta = Pick<Request, 'ip' | 'headers' | 'socket'>;
