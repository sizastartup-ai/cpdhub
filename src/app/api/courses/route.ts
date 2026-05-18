import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profession: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let courses = [];

    if (user.role === 'Admin') {
      courses = await prisma.course.findMany({
        include: { profession: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      if (!user.professionId) {
        return NextResponse.json({ error: 'Profession not set' }, { status: 400 });
      }

      courses = await prisma.course.findMany({
        where: { professionId: user.professionId },
        include: { profession: true },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error('Fetch courses error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
