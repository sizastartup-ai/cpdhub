import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

// POST - Create a new course
export async function POST(req: Request) {
  try {
    const session = await getSessionUser();

    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, price, cpdPoints, professionId } = await req.json();

    if (!title || !description || price === undefined || !cpdPoints || !professionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        cpdPoints: parseInt(cpdPoints),
        professionId,
      },
      include: { profession: true },
    });

    return NextResponse.json(course);
  } catch (err: any) {
    console.error('Create course error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete a course
export async function DELETE(req: Request) {
  try {
    const session = await getSessionUser();

    if (!session || session.role !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('id');

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID required' }, { status: 400 });
    }

    // Delete related records first (cascade)
    await prisma.progress.deleteMany({
      where: {
        lesson: {
          module: { courseId },
        },
      },
    });

    await prisma.question.deleteMany({
      where: {
        quiz: {
          module: { courseId },
        },
      },
    });

    await prisma.quiz.deleteMany({
      where: {
        module: { courseId },
      },
    });

    await prisma.lesson.deleteMany({
      where: {
        module: { courseId },
      },
    });

    await prisma.module.deleteMany({
      where: { courseId },
    });

    await prisma.certificate.deleteMany({
      where: { courseId },
    });

    await prisma.enrollment.deleteMany({
      where: { courseId },
    });

    await prisma.payment.deleteMany({
      where: { courseId },
    });

    await prisma.course.delete({
      where: { id: courseId },
    });

    return NextResponse.json({ message: 'Course deleted successfully' });
  } catch (err: any) {
    console.error('Delete course error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
