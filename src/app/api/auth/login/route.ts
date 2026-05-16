import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword } from '@/lib/auth-utils';
import { supabaseFetch, isSupabaseConfigured } from '@/lib/supabase';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

function getClientIp(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
         request.headers.get('x-real-ip') ||
         'unknown';
}

function isRateLimited(identifier: string): { limited: boolean; remainingAttempts: number; waitSeconds: number } {
  const attempt = loginAttempts.get(identifier);
  const now = Date.now();

  if (!attempt) return { limited: false, remainingAttempts: MAX_LOGIN_ATTEMPTS, waitSeconds: 0 };

  if (now < attempt.lockedUntil) {
    const waitSeconds = Math.ceil((attempt.lockedUntil - now) / 1000);
    return { limited: true, remainingAttempts: 0, waitSeconds };
  }

  if (now - attempt.lockedUntil > LOCKOUT_DURATION && attempt.count >= MAX_LOGIN_ATTEMPTS) {
    loginAttempts.delete(identifier);
    return { limited: false, remainingAttempts: MAX_LOGIN_ATTEMPTS, waitSeconds: 0 };
  }

  return { limited: false, remainingAttempts: MAX_LOGIN_ATTEMPTS - attempt.count, waitSeconds: 0 };
}

function recordFailedAttempt(identifier: string): void {
  const current = loginAttempts.get(identifier) || { count: 0, lockedUntil: 0 };
  const newCount = current.count + 1;
  const lockedUntil = newCount >= MAX_LOGIN_ATTEMPTS ? Date.now() + LOCKOUT_DURATION : current.lockedUntil;
  loginAttempts.set(identifier, { count: newCount, lockedUntil });
}

function recordSuccess(identifier: string): void {
  loginAttempts.delete(identifier);
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  const rateLimitCheck = isRateLimited(clientIp);

  if (rateLimitCheck.limited) {
    return NextResponse.json({
      error: `Too many failed attempts. Please try again in ${rateLimitCheck.waitSeconds} seconds.`
    }, { status: 429 });
  }

  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json({ error: 'Authentication service not available' }, { status: 503 });
    }

    const { data, error } = await supabaseFetch<{ id: string; username: string; password: string; role: string; createdat?: string }>('users', {
      params: { username: `eq.${username}`, select: 'id,username,password,role,createdat' },
    });

    if (error) {
      recordFailedAttempt(clientIp);
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (!data || data.length === 0) {
      recordFailedAttempt(clientIp);
      const remaining = rateLimitCheck.remainingAttempts - 1;
      return NextResponse.json({
        error: 'Invalid username or password',
        remainingAttempts: remaining > 0 ? remaining : 0
      }, { status: 401 });
    }

    const user = data[0];
    const hashedPassword = user.password || '';
    const isValid = await verifyPassword(password, hashedPassword);

    if (!isValid) {
      recordFailedAttempt(clientIp);
      const remaining = rateLimitCheck.remainingAttempts - 1;
      return NextResponse.json({
        error: 'Invalid username or password',
        remainingAttempts: remaining > 0 ? remaining : 0
      }, { status: 401 });
    }

    recordSuccess(clientIp);
    return NextResponse.json({
      user: {
        id: user.id || user.username,
        username: user.username,
        name: user.username,
        email: `${user.username}@3jes.local`,
        role: user.role || 'view_only',
        createdAt: user.createdat || new Date().toISOString(),
        updatedAt: user.createdat || new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}