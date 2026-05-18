import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { questions: true },
    });

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    return NextResponse.json(quiz);
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { answers } = await req.json(); // { questionId: answer }
    const session = await getSessionUser();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: { questions: true },
    });

    if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

    let correctCount = 0;
    quiz.questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        correctCount++;
      }
    });

    const score = (correctCount / quiz.questions.length) * 100;
    const passed = score >= quiz.passMark;

    // Handle course completion if this is a final course assessment
    if (passed && quiz.courseId) {
       // Check if all modules are completed first (strictly speaking, they should be)
       await prisma.enrollment.updateMany({
          where: { userId: session.userId, courseId: quiz.courseId },
          data: {
             status: 'Completed',
             completedAt: new Date()
          }
       });
    }

    return NextResponse.json({
      score,
      passed,
      correctCount,
      totalCount: quiz.questions.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
