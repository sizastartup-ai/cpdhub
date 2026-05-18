'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Mail, Lock, ChevronDown, ArrowRight, Loader2 } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    profession: '',
    country: 'Kenya',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const professions = [
    'Lawyer',
    'Engineer',
    'Quantity Surveyor',
    'Hospitality Professional',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-bg">
      <div className="auth-card" style={{ maxWidth: '460px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800' }}>
            CPD<span style={{
              background: 'linear-gradient(135deg, var(--primary), var(--accent-light))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>Hub</span>
          </h1>
        </div>

        <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem', textAlign: 'center' }}>
          Create Account
        </h2>
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', marginBottom: '2rem', fontSize: '0.9rem' }}>
          Join the community of professionals in Africa.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                id="fullName"
                type="text"
                required
                className="input"
                style={{ paddingLeft: '2.8rem' }}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. John Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                id="email"
                type="email"
                required
                className="input"
                style={{ paddingLeft: '2.8rem' }}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="profession">Profession</label>
            <select
              id="profession"
              required
              className="select"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
            >
              <option value="" disabled>Select your profession</option>
              {professions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                id="password"
                type="password"
                required
                className="input"
                style={{ paddingLeft: '2.8rem' }}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            className={`btn btn-primary btn-lg ${loading ? 'btn-loading' : ''}`}
            style={{ marginTop: '0.5rem', width: '100%' }}
            disabled={loading}
          >
            {loading ? (
              <><Loader2 size={18} style={{ animation: 'spin 0.6s linear infinite' }} /> Creating account...</>
            ) : (
              <>Get Started <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p style={{
          marginTop: '2rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)'
        }}>
          Already have an account?{' '}
          <Link href="/auth/login" style={{
            color: 'var(--primary-light)', fontWeight: '600',
            transition: 'color var(--transition-fast)'
          }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
