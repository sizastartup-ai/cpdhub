import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { moduleId, title, type, url } = body;

    if (!moduleId || !title || !type || !url) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const resource = await (prisma as any).resource.create({
      data: { moduleId, title, type, url }
    });

    return NextResponse.json(resource);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    const session = await getSessionUser();
    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
  
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  
    try {
      await (prisma as any).resource.delete({ where: { id } });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
