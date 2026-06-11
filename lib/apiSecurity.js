const rateLimitStore = new Map();

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.socket?.remoteAddress || 'unknown';
}

export function isAllowedOrigin(req) {
  const originHeader = req.headers.origin;
  if (!originHeader) return true;

  const requestOrigin = normalizeOrigin(originHeader);
  if (!requestOrigin) return false;

  const allowedOrigins = new Set();

  const appOrigin = normalizeOrigin(process.env.APP_URL);
  if (appOrigin) allowedOrigins.add(appOrigin);

  const publicAppOrigin = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL);
  if (publicAppOrigin) allowedOrigins.add(publicAppOrigin);

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || (typeof host === 'string' && host.includes('localhost') ? 'http' : 'https');
  if (typeof host === 'string' && host.length > 0) {
    allowedOrigins.add(`${proto}://${host}`);
  }

  const vercelUrl = req.headers['x-vercel-deployment-url'] || process.env.VERCEL_URL;
  if (typeof vercelUrl === 'string' && vercelUrl.length > 0) {
    allowedOrigins.add(`https://${vercelUrl}`);
  }

  return allowedOrigins.has(requestOrigin);
}

export function checkRateLimit(key, maxRequests = 20, windowMs = 60000) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= maxRequests) {
    return false;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return true;
}
