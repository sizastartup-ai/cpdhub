import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Award, BarChart3, Clock, TrendingUp } from 'lucide-react';
import DashboardClient from './DashboardClient';
import LogoutButton from './LogoutButton';

export default async function Dashboard() {
  const session = await getSessionUser();
  if (!session) redirect('/auth/login');
  if (session.role === 'Admin') redirect('/admin/dashboard');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profession: true,
      enrollments: {
        include: { course: { include: { profession: true } } },
        orderBy: { enrolledAt: 'desc' },
      },
    },
  });

  if (!user) redirect('/auth/login');

  // Fetch courses for this profession
  const recommendedCourses = await prisma.course.findMany({
    where: { professionId: user.professionId || '' },
    include: { profession: true },
    take: 3,
  });

  // Calculate real CPD points
  const completedEnrollments = user.enrollments.filter(e => e.status === 'Completed');
  const totalCpdPoints = completedEnrollments.reduce((sum, e) => sum + (e.course.cpdPoints || 0), 0);
  const inProgressEnrollments = user.enrollments.filter(e => e.status === 'Enrolled');

  return (
    <DashboardClient 
      user={user}
      totalCpdPoints={totalCpdPoints}
      completedEnrollments={completedEnrollments}
      inProgressEnrollments={inProgressEnrollments}
      recommendedCourses={recommendedCourses}
      session={session}
    />
  );
}

