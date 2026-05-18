import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function POST(req: Request) {
  try {
    const { courseId, provider } = await req.json(); // "Stripe" or "Flutterwave"
    const session = await getSessionUser();

    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    // In a real implementation, you would:
    // 1. Create a Stripe/Flutterwave session
    // 2. Return the redirect URL
    
    // FOR MVP: Simulation of successful checkout
    const payment = await prisma.payment.create({
      data: {
        userId: session.userId,
        courseId: course.id,
        amount: course.price,
        currency: 'USD',
        provider: provider,
        status: 'Completed',
      },
    });

    let enrollment = await prisma.enrollment.findFirst({
      where: { userId: session.userId, courseId: course.id },
    });

    if (enrollment) {
      await prisma.enrollment.update({
        where: { id: enrollment.id },
        data: { status: 'Enrolled' },
      });
    } else {
      await prisma.enrollment.create({
        data: {
          userId: session.userId,
          courseId: course.id,
          status: 'Enrolled',
        },
      });
    }

    return NextResponse.json({ 
      message: `Successfully paid with ${provider}`,
      paymentId: payment.id 
    });
  } catch (err: any) {
    console.error('Payment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
