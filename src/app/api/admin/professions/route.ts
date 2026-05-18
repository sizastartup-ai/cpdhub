import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const professions = await prisma.profession.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(professions);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
