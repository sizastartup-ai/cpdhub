import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { title, passMark, moduleId, courseId } = body;

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        passMark: parseInt(passMark) || 70,
        moduleId: moduleId || null,
        courseId: courseId || null,
      },
    });
    return NextResponse.json(quiz);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
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
    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title: body.title,
        passMark: parseInt(body.passMark),
      },
    });
    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
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
    await prisma.quiz.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
