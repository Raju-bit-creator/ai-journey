'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth';

export type RegisterState = {
  error: string | null;
};

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days, matches backend session TTL

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = formData.get('name');
  const email = formData.get('email');
  const password = formData.get('password');

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'Name is required.' };
  }
  if (typeof email !== 'string' || typeof password !== 'string') {
    return { error: 'Email and password are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const res = await fetch(`${process.env.BACKEND_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (res.status === 409) {
    return { error: 'That email is already registered.' };
  }
  if (!res.ok) {
    return { error: 'Could not create account.' };
  }

  const { sessionId } = await res.json();
  (await cookies()).set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect('/products');
}
