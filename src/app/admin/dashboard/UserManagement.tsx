'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, User, Mail, Phone, Award, BookOpen, ChevronDown, ChevronRight, X } from 'lucide-react';

interface Learner {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  points: number;
  coursesCount: number;
  enrolledCourses: { id: string, title: string, status: string }[];
}

export default function UserManagement() {
  const [learners, setLearners] = useState<Learner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLearner, setSelectedLearner] = useState<Learner | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/users?search=${searchTerm}`);
        const data = await res.json();
        if (res.ok) setLearners(data);
      } finally {
        setLoading(false);
      }
    };
    
    // Add debounced search if needed, but for now simple fetch on change or first load
    const timeout = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-subtitle">Track learner progress, points, and enrollments.</p>
      </div>

      <div className="search-bar" style={{ marginBottom: '1.5rem' }}>
        <Search size={18} />
        <input 
          placeholder="Search learners by name or email..." 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && !learners.length ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Loader2 className="spin" size={32} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading learners...</p>
        </div>
      ) : (
        <div className="solid-card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Learner Name</th>
                <th>Email / Contact</th>
                <th>Total Points</th>
                <th>Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {learners.map(learner => (
                <tr key={learner.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar sm">{learner.fullName.charAt(0)}</div>
                      <span style={{ fontWeight: '600' }}>{learner.fullName}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.875rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Mail size={12} style={{ opacity: 0.6 }} /> {learner.email}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <Phone size={12} style={{ opacity: 0.6 }} /> {learner.phone}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Award size={14} /> {learner.points} pts
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <BookOpen size={14} style={{ opacity: 0.6 }} /> {learner.coursesCount} courses
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setSelectedLearner(learner)} className="btn btn-ghost btn-sm">
                      View Details <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {learners.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No learners found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Slide-over or Modal */}
      {selectedLearner && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Learner Details</h2>
              <button onClick={() => setSelectedLearner(null)} className="btn btn-ghost"><X /></button>
            </div>
            
            <div className="glass-card" style={{ marginBottom: '4.5rem', padding: '3rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                <div className="avatar lg">{selectedLearner.fullName.charAt(0)}</div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800' }}>{selectedLearner.fullName}</h3>
                  <p style={{ opacity: 0.7 }}>CPD Learner ID: {selectedLearner.id.split('-')[0].toUpperCase()}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>Email Address</label>
                  <p>{selectedLearner.email}</p>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>Phone Number</label>
                  <p>{selectedLearner.phone || 'N/A'}</p>
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', opacity: 0.6 }}>Total CPD Points</label>
                  <p className="badge badge-success" style={{ fontSize: '1rem', padding: '0.4rem 0.8rem' }}>{selectedLearner.points} Points Earned</p>
                </div>
              </div>
            </div>

            <h4 style={{ fontWeight: '700', marginBottom: '1rem' }}>Enrolled Courses</h4>
            <div className="form-stack">
              {selectedLearner.enrolledCourses.map(course => (
                <div key={course.id} style={{ 
                  padding: '1rem', 
                  background: 'var(--surface-subtle)', 
                  borderRadius: '12px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '600' }}>{course.title}</span>
                  <span className={`badge ${course.status === 'Completed' ? 'badge-success' : 'badge-info'}`}>
                    {course.status}
                  </span>
                </div>
              ))}
              {selectedLearner.enrolledCourses.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No courses enrolled yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
