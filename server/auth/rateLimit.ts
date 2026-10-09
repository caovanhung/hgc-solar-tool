interface AttemptRecord {
  count: number;
  firstAttemptAt: number;
}

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const emailAttempts = new Map<string, AttemptRecord>();
const ipAttempts = new Map<string, AttemptRecord>();

function checkLimit(map: Map<string, AttemptRecord>, key: string): { allowed: boolean; retryAfterSeconds: number } {
  const record = map.get(key);
  if (!record) return { allowed: true, retryAfterSeconds: 0 };

  const now = Date.now();
  if (now - record.firstAttemptAt > WINDOW_MS) {
    map.delete(key);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (record.count >= MAX_ATTEMPTS) {
    const remainingMs = WINDOW_MS - (now - record.firstAttemptAt);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(Math.max(1, remainingMs / 1000)),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

function recordFailure(map: Map<string, AttemptRecord>, key: string): void {
  const now = Date.now();
  const record = map.get(key);
  if (!record || now - record.firstAttemptAt > WINDOW_MS) {
    map.set(key, { count: 1, firstAttemptAt: now });
  } else {
    record.count += 1;
  }
}

export function checkLoginRateLimit(
  email: string,
  ip: string
): { allowed: boolean; retryAfterSeconds: number } {
  const emailCheck = checkLimit(emailAttempts, email.toLowerCase().trim());
  if (!emailCheck.allowed) return emailCheck;

  const ipCheck = checkLimit(ipAttempts, ip);
  if (!ipCheck.allowed) return ipCheck;

  return { allowed: true, retryAfterSeconds: 0 };
}

export function recordFailedLogin(email: string, ip: string): void {
  recordFailure(emailAttempts, email.toLowerCase().trim());
  recordFailure(ipAttempts, ip);
}

export function clearLoginRateLimit(email: string, ip: string): void {
  emailAttempts.delete(email.toLowerCase().trim());
  ipAttempts.delete(ip);
}
