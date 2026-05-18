'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user.role === 'Admin') {
        window.location.href = '/admin/dashboard';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-bg">
      <div className="auth-card stagger">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: '900', color: 'white', letterSpacing: '-0.05em' }}>
            CPD<span style={{ color: 'var(--primary-light)' }}>Hub</span>
          </h1>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem', color: 'white' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-dim)' }}>
            Please sign in to access your portal.
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                id="email"
                type="email"
                required
                className="input"
                style={{ paddingLeft: '3.5rem' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                id="password"
                type="password"
                required
                className="input"
                style={{ paddingLeft: '3.5rem' }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg`}
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={20} className="spin" /> Signing in...</>
            ) : (
              <>Sign In <ArrowRight size={20} /></>
            )}
          </button>
        </form>

        <p style={{
          marginTop: '3rem', textAlign: 'center', fontSize: '0.95rem', color: 'var(--text-muted)'
        }}>
          New to CPDHub?{' '}
          <Link href="/auth/register" style={{
            color: 'var(--primary-light)', fontWeight: '700'
          }}>
            Create a free account
          </Link>
        </p>
      </div>
    </main>
  );
}
