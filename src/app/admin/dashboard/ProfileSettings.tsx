'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, Loader2, Save, X, Check, Camera, Image as ImageIcon } from 'lucide-react';

interface ProfileSettingsProps {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

export default function ProfileSettings({ user }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    image: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/user/profile/me');
        if (res.ok) {
          const data = await res.json();
          setFormData({
            fullName: data.fullName,
            email: data.email,
            phone: data.phone || '',
            image: data.image || '',
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div style={{ padding: '6rem 0', textAlign: 'center' }}>
      <Loader2 className="spin" size={48} style={{ margin: '0 auto', color: 'var(--primary)' }} />
      <p style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Preparing your settings...</p>
    </div>
  );

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">Identity & Security</h1>
        <p className="page-subtitle">Manage your personal information and profile visibility.</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '700px', margin: '0 auto' }}>
        <form onSubmit={handleUpdate} className="form-stack">
          {/* Profile Picture Header */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            marginBottom: '3rem',
            textAlign: 'center' 
          }}>
            <div style={{ position: 'relative' }}>
              <div className="avatar lg" style={{ width: '120px', height: '120px', fontSize: '3rem' }}>
                {formData.image ? (
                  <img src={formData.image} alt="Profile" />
                ) : (
                  formData.fullName.charAt(0)
                )}
              </div>
              <label 
                className="btn btn-primary btn-sm" 
                style={{ 
                  position: 'absolute', 
                  bottom: '0', 
                  right: '0', 
                  borderRadius: '50%', 
                  padding: '0.6rem',
                  border: '3px solid white',
                  boxShadow: 'var(--shadow-md)'
                }}
                title="Change Photo"
              >
                <Camera size={16} />
                <input 
                  type="text" 
                  style={{ display: 'none' }} // In a real app, this would be a file input
                  placeholder="Paste image URL here"
                  onChange={e => setFormData({ ...formData, image: e.target.value })}
                />
              </label>
            </div>
            <h3 style={{ marginTop: '1.5rem', fontSize: '1.5rem', fontWeight: '800' }}>{formData.fullName}</h3>
            <p className="badge badge-info" style={{ marginTop: '0.5rem' }}>{user.role} Member</p>
          </div>

          {message && (
            <div className={`alert alert-${message.type}`} style={{ marginBottom: '2.5rem' }}>
              {message.type === 'success' ? <Check size={20} /> : <X size={20} />}
              {message.text}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div className="form-group">
              <label className="form-label">Full Legal Name</label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  required
                  className="input" 
                  style={{ paddingLeft: '3rem' }}
                  value={formData.fullName} 
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Reference</label>
              <div style={{ position: 'relative' }}>
                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="input" 
                  style={{ paddingLeft: '3rem' }}
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Primary Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                required
                type="email"
                className="input" 
                style={{ paddingLeft: '3rem' }}
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Profile Image URL</label>
            <div style={{ position: 'relative' }}>
              <ImageIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input" 
                style={{ paddingLeft: '3rem' }}
                value={formData.image} 
                onChange={e => setFormData({ ...formData, image: e.target.value })} 
                placeholder="https://images.unsplash.com/photo-..."
              />
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>Paste a link to your hosting service (Unsplash, Cloudinary, etc.)</p>
          </div>


          <div style={{ paddingTop: '1rem' }}>
            <button 
              disabled={saving} 
              className={`btn btn-primary btn-lg`}
              style={{ width: '100%', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.4)' }}
            >
              {saving ? (
                <><Loader2 className="spin" size={20} /> Synchronizing...</>
              ) : (
                <><Save size={20} /> Commit Changes</>
              )}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
