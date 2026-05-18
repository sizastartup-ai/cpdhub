import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import AdminDashboardView from './AdminDashboardView';

export default async function AdminDashboard() {
  const session = await getSessionUser();

  if (!session || session.role !== 'Admin') {
    redirect('/dashboard');
  }

  // Fetch initial data
  const totalUsers = await prisma.user.count({ where: { role: 'Learner' } });
  const totalCourses = await prisma.course.count();
  const totalEnrollments = await prisma.enrollment.count();
  const allPayments = await prisma.payment.findMany({ where: { status: 'Completed' } });
  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);

  const courses = await prisma.course.findMany({
    include: { 
      profession: true, 
      _count: { select: { enrollments: true } },
      enrollments: {
        where: { completedAt: null },
        select: { id: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });

  const professions = await prisma.profession.findMany({
    orderBy: { name: 'asc' },
  });

  const serializedCourses = courses.map(c => ({
    id: c.id,
    title: c.title,
    description: c.description,
    professionId: c.professionId,
    professionName: c.profession.name,
    totalEnrollments: c._count.enrollments,
    ongoingEnrollments: c.enrollments.length,
    cpdPoints: c.cpdPoints,
    price: c.price,
  }));

  const userStats = {
    totalUsers,
    totalCourses,
    totalEnrollments,
    totalRevenue
  };

  return (
    <AdminDashboardView 
      initialCourses={serializedCourses} 
      professions={professions}
      userStats={userStats}
      adminUser={session}
    />
  );
}

