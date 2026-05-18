import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone || '',
      image: user.image || '',
      role: user.role
    });
  } catch (error) {
    console.error('Profile Me API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
