import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { courseId, title, contentType, contentUrl } = await req.json();

    // Create or find a generic Module first
    let moduleRecord = await prisma.module.findFirst({ where: { courseId } });
    if (!moduleRecord) {
      moduleRecord = await prisma.module.create({
        data: {
          courseId,
          title: 'Main Module',
          order: 1,
        },
      });
    }

    const lessonCount = await prisma.lesson.count({ where: { moduleId: moduleRecord.id } });

    // Create the Lesson
    const lesson = await prisma.lesson.create({
      data: {
        moduleId: moduleRecord.id,
        title,
        order: lessonCount + 1,
        contentType: contentType || 'SCORM',
        contentUrl: contentUrl || '',
      },
    });

    return NextResponse.json(lesson);
  } catch (error: any) {
    console.error('Lesson creation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

