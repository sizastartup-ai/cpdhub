import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Award, FileText, Download, CheckCircle, ExternalLink, BookOpen, BarChart3 } from 'lucide-react';
import LogoutButton from '../dashboard/LogoutButton';

export default async function CertificatesPage() {
  const session = await getSessionUser();
  if (!session) redirect('/auth/login');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      profession: true,
      certificates: {
        include: { course: true },
        orderBy: { issuedAt: 'desc' },
      },
      enrollments: {
        where: { status: 'Completed' },
        include: { course: true },
      },
    },
  });

  if (!user) redirect('/auth/login');

  const totalPoints = user.certificates.reduce((sum, cert) => sum + cert.course.cpdPoints, 0);

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
            <Link href="/courses" className="sidebar-link">
              <BookOpen size={20} /> Browse Courses
            </Link>
            <Link href="/certificates" className="sidebar-link active">
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

      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Professional Transcript</h1>
          <p className="page-subtitle">Your verified Continuing Professional Development record.</p>
        </div>

        {/* Summary Card */}
        <div className="glass-card" style={{
          padding: '2.5rem', textAlign: 'center', marginBottom: '2.5rem',
          background: 'rgba(30, 41, 59, 0.5)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%', width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(59,130,246,0.08), transparent 70%)',
            borderRadius: '50%', pointerEvents: 'none'
          }} />
          <Award size={48} color="var(--primary-light)" style={{ marginBottom: '1rem', position: 'relative' }} />
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Earned CPD Points</p>
          <p style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
            {totalPoints}
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--success)', fontWeight: '700', marginTop: '0.5rem' }}>
            {user.certificates.length} {user.certificates.length === 1 ? 'Course' : 'Courses'} Completed
          </p>
        </div>

        {/* Certificates List */}
        <section>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: '700' }}>Earned Certificates</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {user.certificates.map(cert => (
              <div key={cert.id} className="solid-card" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '1.5rem', flexWrap: 'wrap', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: 'var(--radius-md)',
                    background: 'rgba(59, 130, 246, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <FileText size={24} color="var(--primary-light)" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.3rem' }}>
                      {cert.course.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                      <span className="badge badge-success">
                        <CheckCircle size={12} /> Verified
                      </span>
                      <span>Issued {new Date(cert.issuedAt).toLocaleDateString()}</span>
                      <span>{cert.course.cpdPoints} Points</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <Link
                    href={`/verify/${cert.certificateUuid}`}
                    target="_blank"
                    className="btn btn-secondary btn-sm"
                  >
                    <ExternalLink size={14} /> Verify
                  </Link>
                </div>
              </div>
            ))}

            {user.certificates.length === 0 && (
              <div className="solid-card empty-state">
                <Award size={48} className="empty-state-icon" />
                <p>You haven&apos;t earned any certificates yet. Complete a course to receive your first one!</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
