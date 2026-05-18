'use client';

import { useState } from 'react';
import { 
  Users, DollarSign, BookOpen, BarChart3, TrendingUp, 
  Settings, LogOut, Search, User, Mail, Phone, ChevronRight 
} from 'lucide-react';
import CourseManagement from './CourseManagement';
import UserManagement from './UserManagement';
import Financials from './Financials';
import ProfileSettings from './ProfileSettings';

interface AdminDashboardViewProps {
  initialCourses: any[];
  professions: any[];
  userStats: {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalRevenue: number;
  };
  adminUser: {
    userId: string;
    email: string;
    role: string;
  };
}

export default function AdminDashboardView({ 
  initialCourses, 
  professions, 
  userStats: initialStats,
  adminUser 
}: AdminDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'financials' | 'profile'>('overview');
  
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/auth/login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <div className="page-header">
              <h1 className="page-title">Platform Overview</h1>
              <p className="page-subtitle">Real-time analytics for CPDHub.</p>
            </div>

            {/* Stats Grid */}
            <div className="stat-grid stagger">
              <div className="stat-card">
                <div className="stat-icon green"><DollarSign size={22} /></div>
                <div>
                  <p className="stat-label">Revenue</p>
                  <p className="stat-value">${initialStats.totalRevenue.toFixed(2)}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue"><Users size={22} /></div>
                <div>
                  <p className="stat-label">Learners</p>
                  <p className="stat-value">{initialStats.totalUsers}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon orange"><BookOpen size={22} /></div>
                <div>
                  <p className="stat-label">Courses</p>
                  <p className="stat-value">{initialStats.totalCourses}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon purple"><TrendingUp size={22} /></div>
                <div>
                  <p className="stat-label">Enrollments</p>
                  <p className="stat-value">{initialStats.totalEnrollments}</p>
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', fontWeight: '700' }}>Recent Activity</h3>
              <p style={{ color: 'var(--text-muted)' }}>More analytics coming soon...</p>
            </div>
          </>
        );
      case 'courses':
        return <CourseManagement initialCourses={initialCourses} professions={professions} />;
      case 'users':
        return <UserManagement />;
      case 'financials':
        return <Financials initialRevenue={initialStats.totalRevenue} />;
      case 'profile':
        return <ProfileSettings user={adminUser} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      {/* Admin Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          CPD<span>Admin</span>
        </div>

        <div>
          <div className="sidebar-section-title">Management</div>
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <BarChart3 size={20} /> Overview
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'courses' ? 'active' : ''}`}
              onClick={() => setActiveTab('courses')}
            >
              <BookOpen size={20} /> Course Management
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} /> User Management
            </button>
            <button 
              className={`sidebar-link ${activeTab === 'financials' ? 'active' : ''}`}
              onClick={() => setActiveTab('financials')}
            >
              <DollarSign size={20} /> Financials
            </button>
          </nav>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <div className="sidebar-section-title">Account</div>
          <nav className="sidebar-nav">
            <button 
              className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <User size={20} /> Edit Profile
            </button>
            <button 
              className="sidebar-link" 
              onClick={handleLogout}
              style={{ color: 'var(--error)' }}
            >
              <LogOut size={20} /> Log Out
            </button>
          </nav>
        </div>
      </aside>

      <main className="main-content">
        {renderContent()}
      </main>
    </div>
  );
}
