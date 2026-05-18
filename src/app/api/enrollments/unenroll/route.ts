import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }

  try {
    // 1. Delete all progress records for this course's modules/lessons for this user
    // First find all modules of this course
    const modules = await prisma.module.findMany({
        where: { courseId: courseId },
        select: { id: true, lessons: { select: { id: true } } }
    });

    const moduleIds = modules.map(m => m.id);
    const lessonIds = modules.flatMap(m => m.lessons.map(l => l.id));

    await prisma.progress.deleteMany({
      where: {
        userId: session.userId,
        OR: [
          { moduleId: { in: moduleIds } },
          { lessonId: { in: lessonIds } }
        ]
      }
    });

    // 2. Delete the enrollment record
    await prisma.enrollment.deleteMany({
      where: {
        userId: session.userId,
        courseId: courseId,
      },
    });

    return NextResponse.json({ success: true, message: 'Successfully un-enrolled and progress cleared.' });
  } catch (error: any) {
    console.error('Un-enrollment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
