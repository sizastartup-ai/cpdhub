import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const moduleId = searchParams.get('moduleId');

  if (!moduleId) {
    return NextResponse.json({ error: 'Missing moduleId' }, { status: 400 });
  }

  try {
    const resources = await (prisma as any).resource.findMany({
      where: { moduleId },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(resources);
  } catch (error: any) {
    console.error('Resource fetch failure:', error);
    return NextResponse.json({ error: 'Failed to load resources' }, { status: 500 });
  }
}
