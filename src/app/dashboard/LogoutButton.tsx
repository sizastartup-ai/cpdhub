'use client';

import { LogOut } from 'lucide-react';
import { useState } from 'react';

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/login';
    } catch {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="sidebar-link"
      style={{ color: 'var(--error)', cursor: loading ? 'wait' : 'pointer' }}
    >
      <LogOut size={20} /> {loading ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
