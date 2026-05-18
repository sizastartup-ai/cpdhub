import Link from 'next/link';
import { Award, BookOpen, Shield, BarChart3, ChevronRight, Sparkles } from 'lucide-react';
import NetworkBackground from './components/NetworkBackground';

export default function Home() {
  return (
    <main className="hero-bg" style={{ 
      padding: '4rem 2rem', 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <NetworkBackground />
      {/* Enhanced Africa network background */}

      {/* Hero Content */}
      <div style={{
        position: 'relative', zIndex: 1, maxWidth: '800px', textAlign: 'center',
        marginBottom: '5rem', animation: 'fadeIn 0.6s ease-out'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
          padding: '0.4rem 1rem', borderRadius: '999px',
          background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)',
          fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-light)',
          marginBottom: '2rem'
        }}>
          <Sparkles size={14} /> Africa&apos;s Premier CPD Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: '900',
          lineHeight: '1.05', marginBottom: '1.5rem', letterSpacing: '-0.04em'
        }}>
          Elevate Your{' '}
          <span style={{
            background: 'linear-gradient(135deg, var(--primary), var(--accent-light))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            Professional
          </span>
          <br />Growth with CPDHub
        </h1>

        <p style={{
          fontSize: '1.25rem', color: 'var(--text-secondary)',
          maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.7'
        }}>
          Tailored Continuing Professional Development for Lawyers, Engineers,
          Quantity Surveyors, and Hospitality Professionals across Africa.
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/auth/register" className="btn btn-primary btn-lg" style={{ gap: '0.5rem' }}>
            Get Started Free <ChevronRight size={18} />
          </Link>
          <Link href="/auth/login" className="btn btn-secondary btn-lg">
            Sign In
          </Link>
        </div>
      </div>

      {/* Feature Cards */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '2rem', width: '100%', maxWidth: '1100px',
        animation: 'slideUp 0.8s ease-out 0.2s both',
        margin: '0 auto'
      }}>
        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
            background: 'rgba(59, 130, 246, 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
          }}>
            <BookOpen size={28} color="var(--primary-light)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '700' }}>Profession-Specific Content</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            Curated courses tailored to the unique requirements of your professional field.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
            background: 'rgba(34, 197, 94, 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
          }}>
            <Shield size={28} color="var(--success)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '700' }}>Verified Certificates</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            QR-code verified certificates you can download and share with your regulatory body.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '2.5rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: 'var(--radius-md)',
            background: 'rgba(99, 102, 241, 0.12)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem'
          }}>
            <BarChart3 size={28} color="var(--accent-light)" />
          </div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', fontWeight: '700' }}>Track Your Points</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
            Maintain a complete digital transcript of all your CPD points in one platform.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'relative', zIndex: 1, marginTop: '5rem',
        color: 'var(--text-dim)', fontSize: '0.9rem', textAlign: 'center'
      }}>
        &copy; 2026 CPDHub. Built for Africa&apos;s professionals.
      </div>
    </main>
  );
}
