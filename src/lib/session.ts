import { cookies } from 'next/headers';
import { verifyToken } from './auth';

export async function getSessionUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('cpdhub_token')?.value;

  if (!token) return null;

  const decoded = await verifyToken(token) as { userId: string; email: string; role: string } | null;
  return decoded;
}
