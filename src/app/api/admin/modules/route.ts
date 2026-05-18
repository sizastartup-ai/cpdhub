import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, title, order, videoUrl } = await req.json();
  if (!courseId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const module = await prisma.module.create({
      data: {
        courseId,
        title,
        order: parseInt(order) || 0,
        videoUrl: videoUrl || '',
      },
    });
    return NextResponse.json(module);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const courseId = searchParams.get('courseId');

  if (!courseId) return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });

  const modules = await prisma.module.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    include: {
      lessons: { orderBy: { order: 'asc' } },
      quizzes: {
        include: { questions: true },
      },
    },
  });

  const courseQuizzes = await prisma.quiz.findMany({
    where: { courseId, moduleId: null },
    include: { questions: true },
  });

  return NextResponse.json({ modules, courseQuizzes });
}

export async function PATCH(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json();

  try {
    const updated = await prisma.module.update({
      where: { id },
      data: {
        title: body.title,
        order: body.order ? parseInt(body.order) : undefined,
        videoUrl: body.videoUrl,
      },
    });
    return NextResponse.json(updated);
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
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await prisma.module.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
