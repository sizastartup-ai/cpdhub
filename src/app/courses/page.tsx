import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Search, BookOpen, Award, BarChart3 } from 'lucide-react';
import LogoutButton from '../dashboard/LogoutButton';

export default async function CoursesCatalog({ searchParams }: { searchParams: { query?: string } }) {
  const session = await getSessionUser();
  if (!session) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { profession: true },
  });

  if (!user) redirect('/auth/login');

  const query = searchParams.query || '';

  const courses = await prisma.course.findMany({
    where: {
      professionId: user.professionId || '',
      OR: [
        { title: { contains: query } },
        { description: { contains: query } },
      ],
    },
    include: { profession: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get enrollments for the user to show enrolled state
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: session.userId },
  });

  const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          CPD<span>Hub</span>
        </div>

        <div>
          <div className="sidebar-section-title">Main</div>
          <nav className="sidebar-nav">
            <Link href="/dashboard" className="sidebar-link">
              <BarChart3 size={20} /> Dashboard
            </Link>
            <Link href="/courses" className="sidebar-link active">
              <BookOpen size={20} /> Browse Courses
            </Link>
            <Link href="/certificates" className="sidebar-link">
              <Award size={20} /> Certificates
            </Link>
          </nav>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(148, 163, 184, 0.04)', marginBottom: '0.75rem'
          }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>
              {user.fullName}
            </p>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.profession?.name || 'Professional'}
            </p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main */}
      <main className="main-content">
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 className="page-title">Browse Courses</h1>
          <p className="page-subtitle">
            Showing courses for <strong style={{ color: 'var(--primary-light)' }}>{user.profession?.name}</strong>
          </p>
        </div>

        {/* Search Bar */}
        <form style={{
          display: 'flex', gap: '0.75rem', marginBottom: '2.5rem',
          maxWidth: '600px'
        }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-dim)'
            }} />
            <input
              name="query"
              type="text"
              placeholder="Search courses..."
              className="input"
              style={{ paddingLeft: '2.8rem' }}
              defaultValue={query}
            />
          </div>
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        {/* Course Grid */}
        <div className="course-grid stagger">
          {courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-card-image">
                <BookOpen size={48} style={{ position: 'relative', zIndex: 1, opacity: 0.5 }} />
              </div>
              <div className="course-card-body">
                <div className="course-card-meta">
                  <span className="course-tag">{course.profession.name}</span>
                  <span className="course-points"><Award size={14} /> {course.cpdPoints} pts</span>
                </div>
                <h3 className="course-card-title">{course.title}</h3>
                <p className="course-card-desc">{course.description}</p>
                <div className="course-card-footer">
                  <span className="course-price">Ksh {course.price}</span>
                  <Link href={`/courses/${course.id}`} className="btn btn-primary btn-sm">
                    {enrolledCourseIds.has(course.id) ? 'Continue' : 'Enroll Now'}
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="empty-state">
            <BookOpen size={48} className="empty-state-icon" />
            <p>No courses found. {query ? 'Try a different search term.' : 'Check back soon!'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
