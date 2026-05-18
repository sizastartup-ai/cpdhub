import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { moduleId, courseId } = await req.json();
  if (!moduleId || !courseId) {
    return NextResponse.json({ error: 'Missing moduleId or courseId' }, { status: 400 });
  }

  try {
    // 0. Verify IDs and User/Module existence
    console.log(`Syncing progress for User: ${session.userId}, Module: ${moduleId}, Course: ${courseId}`);
    
    const [userExists, moduleExists] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.userId } }),
      prisma.module.findUnique({ where: { id: moduleId } })
    ]);

    if (!userExists) return NextResponse.json({ error: `User ID ${session.userId} not found in DB.` }, { status: 404 });
    if (!moduleExists) return NextResponse.json({ error: `Module ID ${moduleId} not found.` }, { status: 404 });

    // 1. Manual Progress Check & Update (Avoid problematic generic upsert)
    let progressRecord = await prisma.progress.findUnique({
      where: {
        userId_moduleId: {
          userId: session.userId,
          moduleId: moduleId,
        }
      }
    });

    if (progressRecord) {
      await prisma.progress.update({
        where: { id: progressRecord.id },
        data: { completed: true }
      });
    } else {
      await prisma.progress.create({
        data: {
          userId: session.userId,
          moduleId: moduleId,
          completed: true,
        }
      });
    }

    // 2. Recalculate progress for course enrollment
    const allModules = await prisma.module.findMany({
      where: { courseId: courseId },
    });
    const totalModules = allModules.length;

    const completedProgress = await prisma.progress.findMany({
      where: {
        userId: session.userId,
        moduleId: { in: allModules.map(m => m.id) },
        completed: true,
      },
    });
    const completedModules = completedProgress.length;

    const progressPercentage = totalModules > 0 ? (completedModules / totalModules) * 100 : 0;

    // 3. Update Course Enrollment (if they are enrolled)
    const hasCourseQuiz = await prisma.quiz.findFirst({
      where: { courseId: courseId }
    });

    const isFinishedModules = progressPercentage >= 99.9; // Handle floating point

    await prisma.enrollment.updateMany({
      where: { userId: session.userId, courseId: courseId },
      data: {
        progress: parseFloat(progressPercentage.toFixed(2)),
        status: isFinishedModules 
          ? (hasCourseQuiz ? 'Awaiting Assessment' : 'Completed') 
          : 'Enrolled',
        completedAt: (isFinishedModules && !hasCourseQuiz) ? new Date() : null
      },
    });

    return NextResponse.json({ 
      success: true,
      progress: progressPercentage,
      completedModules,
      totalModules,
      status: isFinishedModules ? (hasCourseQuiz ? 'Awaiting Assessment' : 'Completed') : 'Enrolled'
    });

    return NextResponse.json({ 
      progress: progressPercentage,
      completedModules,
      totalModules
    });
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
