import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Award, BookOpen } from 'lucide-react';
import CourseContent from './CourseContent';

export default async function CoursePage({ params }: { params: { id: string } }) {
  const session = await getSessionUser();
  if (!session) redirect('/auth/login');

  const courseId = params.id;

  const [course, user] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        profession: true,
        quizzes: {
           include: { questions: true }
        }, // Course exams
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: { orderBy: { order: 'asc' } },
            quizzes: true,
          },
        },
      },
    }),
    prisma.user.findUnique({ 
        where: { id: session.userId },
        select: { fullName: true }
    })
  ]);

  if (!course) redirect('/dashboard');

  // Check enrollment
  let enrollment = await prisma.enrollment.findFirst({
    where: { userId: session.userId, courseId: course.id },
  });

  const isEnrolled = !!enrollment || session.role === 'Admin';

  // Get completed lessons and modules
  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));
  const allModuleIds = course.modules.map(m => m.id);
  
  const progressRecords = await prisma.progress.findMany({
    where: { 
      userId: session.userId, 
      OR: [
        { lessonId: { in: allLessonIds } },
        { moduleId: { in: allModuleIds } }
      ]
    },
  });

  const completedLessonIds = progressRecords.filter(p => p.completed && p.lessonId).map(p => p.lessonId!);
  const completedModuleIds = progressRecords.filter(p => p.completed && p.moduleId).map(p => p.moduleId!);

  const totalModules = allModuleIds.length;
  const progressPercentage = totalModules > 0
    ? Math.round((completedModuleIds.length / totalModules) * 100)
    : 0;

  // Serialize data for the client component
  const courseData = {
    id: course.id,
    title: course.title,
    description: course.description,
    cpdPoints: course.cpdPoints,
    price: course.price,
    profession: course.profession.name,
    quizzes: course.quizzes.map(q => ({
      id: q.id,
      title: q.title,
      passMark: q.passMark,
    })),
    modules: course.modules.map(m => ({
      id: m.id,
      title: m.title,
      videoUrl: m.videoUrl,
      order: m.order,
      lessons: m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        contentType: l.contentType,
        contentUrl: l.contentUrl,
        order: l.order,
      })),
      quizzes: m.quizzes.map(q => ({
        id: q.id,
        title: q.title,
        passMark: q.passMark,
      })),
    })),
  };

  return (
    <CourseContent
      course={courseData}
      isEnrolled={isEnrolled}
      completedLessonIds={completedLessonIds}
      completedModuleIds={completedModuleIds}
      progressPercentage={progressPercentage}
      totalLessons={totalModules}
      completedCount={completedModuleIds.length}
      userRole={session.role}
      enrollmentStatus={enrollment?.status || 'Enrolled'}
      userName={user?.fullName || 'Learner'}
    />

  );
}
