import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET() {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // 1. Total Revenue
    const completedPayments = await prisma.payment.findMany({
      where: { status: 'Completed' }
    });
    const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);

    // 2. Top 5 Paid Courses (by enrollment count where course price > 0)
    const topPaidCourses = await prisma.course.findMany({
      where: { price: { gt: 0 } },
      include: {
        _count: { select: { enrollments: true } }
      },
      orderBy: {
        enrollments: { _count: 'desc' }
      },
      take: 5
    });

    // 3. Top 5 Free Courses (by enrollment count where course price == 0)
    const topFreeCourses = await prisma.course.findMany({
      where: { price: 0 },
      include: {
        _count: { select: { enrollments: true } }
      },
      orderBy: {
        enrollments: { _count: 'desc' }
      },
      take: 5
    });

    return NextResponse.json({
      totalRevenue,
      topPaidCourses: topPaidCourses.map(c => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.enrollments,
        price: c.price
      })),
      topFreeCourses: topFreeCourses.map(c => ({
        id: c.id,
        title: c.title,
        enrollments: c._count.enrollments,
        price: c.price
      }))
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
