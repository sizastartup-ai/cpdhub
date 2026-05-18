import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

export async function GET(req: Request) {
  const session = await getSessionUser();
  if (!session || session.role !== 'Admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || '';

  try {
    const learners = await prisma.user.findMany({
      where: {
        role: 'Learner',
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } }
        ]
      },
      include: {
        enrollments: {
          include: { course: true }
        },
        certificates: {
          include: { course: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const serializedLearners = learners.map(user => {
      // Points = sum of cpdPoints for courses that have a certificate
      const points = user.certificates.reduce((sum, cert) => sum + cert.course.cpdPoints, 0);

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone || 'N/A',
        points,
        coursesCount: user.enrollments.length,
        enrolledCourses: user.enrollments.map(e => ({
          id: e.course.id,
          title: e.course.title,
          status: e.status
        }))
      };
    });

    return NextResponse.json(serializedLearners);
  } catch (error) {
    console.error('Users API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
