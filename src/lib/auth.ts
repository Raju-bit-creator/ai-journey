import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'sid';

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
};

export async function getSessionHeader(): Promise<Record<string, string>> {
  const sessionId = (await cookies()).get(SESSION_COOKIE)?.value;
  return sessionId ? { 'x-session-id': sessionId } : {};
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const headers = await getSessionHeader();
  if (!headers['x-session-id']) return null;

  const res = await fetch(`${process.env.BACKEND_URL}/auth/me`, {
    headers,
    cache: 'no-store',
  });
  if (!res.ok) return null;
  return res.json();
}
