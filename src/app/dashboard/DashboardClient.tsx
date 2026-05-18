'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BookOpen, Award, BarChart3, Clock, TrendingUp, User, LogOut } from 'lucide-react';
import ProfileSettings from '../admin/dashboard/ProfileSettings'; // Reusing the component

interface DashboardClientProps {
  user: any;
  totalCpdPoints: number;
  completedEnrollments: any[];
  inProgressEnrollments: any[];
  recommendedCourses: any[];
  session: {
    userId: string;
    email: string;
    role: string;
  };
}

export default function DashboardClient({
  user,
  totalCpdPoints,
  completedEnrollments,
  inProgressEnrollments,
  recommendedCourses,
  session
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/auth/login';
  };

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
            <button 
              className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={20} /> Dashboard
            </button>
            <Link href="/courses" className="sidebar-link">
              <BookOpen size={20} /> Browse Courses
            </Link>
            <Link href="/certificates" className="sidebar-link">
              <Award size={20} /> Certificates
            </Link>
          </nav>
        </div>

        <div style={{ marginTop: 'auto' }}>
          <div className="sidebar-section-title">Account</div>
          <div style={{ padding: '0 1.25rem 1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="avatar sm">
                {user.image ? <img src={user.image} alt="" /> : user.fullName.charAt(0)}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.fullName}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.profession?.name || 'Professional'}
                </p>
              </div>
            </div>
            <nav className="sidebar-nav">
              <button 
                className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <User size={18} /> My Profile
              </button>
              <button className="sidebar-link" onClick={handleLogout} style={{ color: 'var(--error)' }}>
                <LogOut size={18} /> Log Out
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {activeTab === 'dashboard' ? (
          <>
            <header style={{ marginBottom: '4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '2rem' }}>
              <div>
                <h1 className="page-title">Welcome back, {user.fullName.split(' ')[0]}</h1>
                <p className="page-subtitle">{user.profession?.name} &middot; {user.country}</p>
              </div>
            </header>


            {/* Stats Row */}
            <div className="stat-grid stagger">
              <div className="stat-card">
                <div className="stat-icon blue"><Award size={22} /></div>
                <div>
                  <p className="stat-label">CPD Points</p>
                  <p className="stat-value">{totalCpdPoints}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green"><BookOpen size={22} /></div>
                <div>
                  <p className="stat-label">Enrolled</p>
                  <p className="stat-value">{user.enrollments.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple"><TrendingUp size={22} /></div>
                <div>
                  <p className="stat-label">Completed</p>
                  <p className="stat-value">{completedEnrollments.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><Clock size={22} /></div>
                <div>
                  <p className="stat-label">In Progress</p>
                  <p className="stat-value">{inProgressEnrollments.length}</p>
                </div>
              </div>
            </div>

            {/* In Progress Courses */}
            {inProgressEnrollments.length > 0 && (
              <section style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: '700' }}>Continue Learning</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {inProgressEnrollments.slice(0, 3).map(enrollment => (
                    <Link
                      key={enrollment.id}
                      href={`/courses/${enrollment.courseId}`}
                      className="solid-card"
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.25rem 1.75rem',
                        textDecoration: 'none', transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        width: '52px', height: '52px', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-md)',
                        background: 'rgba(59, 130, 246, 0.08)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <BookOpen size={24} color="var(--primary-light)" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '800', fontSize: '1rem', marginBottom: '0.6rem', color: 'white' }}>
                          {enrollment.course.title}
                        </p>
                        <div className="progress-bar" style={{ height: '8px' }}>
                          <div className="progress-fill" style={{ width: `${enrollment.progress}%` }} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--primary-light)' }}>
                          {enrollment.progress}%
                        </p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Complete</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Recommended Courses */}
            <section>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Recommended for You</h2>
                <Link href="/courses" className="btn btn-ghost btn-sm">View All →</Link>
              </div>
              <div className="course-grid stagger">
                {recommendedCourses.map(course => (
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
                          {user.enrollments.some((e: any) => e.courseId === course.id) ? 'Continue' : 'Enroll Now'}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <ProfileSettings user={session} />
        )}
      </main>
    </div>
  );
}
