import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { lessonId, courseId } = await req.json();
    const session = await getSessionUser();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Mark lesson as complete
    const progress = await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: session.userId,
          lessonId,
        },
      },
      update: { completed: true },
      create: {
        userId: session.userId,
        lessonId,
        completed: true,
      },
    });

    // Recalculate course progress
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          include: { lessons: true },
        },
      },
    });

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
    const totalLessons = allLessonIds.length;

    const completedLessons = await prisma.progress.count({
      where: {
        userId: session.userId,
        lessonId: { in: allLessonIds },
        completed: true,
      },
    });

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Update enrollment progress
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: session.userId, courseId },
    });

    if (enrollment) {
      const updateData: { progress: number; status?: string; completedAt?: Date } = {
        progress: progressPercentage,
      };

      if (progressPercentage === 100) {
        updateData.status = 'Completed';
        updateData.completedAt = new Date();
      }

      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: updateData,
      });
    }

    return NextResponse.json({
      message: 'Lesson completed',
      progressPercentage,
      completedLessons,
      totalLessons,
      courseCompleted: progressPercentage === 100,
    });
  } catch (err: any) {
    console.error('Progress error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
