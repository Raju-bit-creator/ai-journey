'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSessionHeader, SESSION_COOKIE } from '@/lib/auth';

export async function logoutAction(): Promise<void> {
  const headers = await getSessionHeader();
  if (headers['x-session-id']) {
    await fetch(`${process.env.BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers,
    });
  }

  (await cookies()).delete(SESSION_COOKIE);
  redirect('/products');
}
