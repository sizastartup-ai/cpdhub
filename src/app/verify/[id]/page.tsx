import { prisma } from '@/lib/prisma';
import { CheckCircle, XCircle, Award, Shield } from 'lucide-react';

export default async function VerifyCertificate({ params }: { params: { id: string } }) {
  const certificate = await prisma.certificate.findUnique({
    where: { certificateUuid: params.id },
    include: {
      user: true,
      course: { include: { profession: true } },
    },
  });

  const isValid = !!certificate;

  return (
    <main className="auth-bg" style={{ padding: '2rem' }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '560px', padding: '3rem', textAlign: 'center',
        background: 'rgba(30, 41, 59, 0.6)', animation: 'fadeIn 0.5s ease-out'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>
            CPD<span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent-light))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Hub</span>
          </h2>
        </div>

        <Shield size={48} color="var(--primary-light)" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Certificate Verification</h1>

        {isValid ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <div className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
              <CheckCircle size={16} /> VALID CERTIFICATE
            </div>

            <div style={{
              width: '100%', height: '1px', background: 'var(--border)'
            }} />

            <div style={{
              textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem'
            }}>
              {[
                { label: 'Recipient', value: certificate.user.fullName },
                { label: 'Course', value: certificate.course.title },
                { label: 'Profession', value: certificate.course.profession.name },
                { label: 'CPD Points Earned', value: `${certificate.course.cpdPoints} Points` },
                { label: 'Issued On', value: new Date(certificate.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) },
              ].map(item => (
                <div key={item.label}>
                  <p style={{
                    fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.2rem'
                  }}>
                    {item.label}
                  </p>
                  <p style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
                    {item.value}
                  </p>
                </div>
              ))}
              <div>
                <p style={{
                  fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase',
                  letterSpacing: '0.05em', color: 'var(--text-dim)', marginBottom: '0.2rem'
                }}>
                  Certificate ID
                </p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                  {certificate.certificateUuid}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', gap: '1rem',
            alignItems: 'center', animation: 'fadeIn 0.4s ease-out'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--error-bg)', display: 'flex',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <XCircle size={32} color="var(--error)" />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--error)' }}>Invalid or Expired</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              We could not find a record for this certificate. Please ensure the link is correct.
            </p>
          </div>
        )}

        <div style={{ marginTop: '2.5rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Verified by CPDHub Learning Platform &copy; 2026
          </p>
        </div>
      </div>
    </main>
  );
}
