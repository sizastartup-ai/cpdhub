'use client';

import { useState, useEffect } from 'react';
import { DollarSign, Loader2, TrendingUp, TrendingDown, BookOpen, User, Star, ChevronDown, ChevronRight, X } from 'lucide-react';

interface CourseStat {
  id: string;
  title: string;
  enrollments: number;
  price: number;
}

interface FinancialData {
  totalRevenue: number;
  topPaidCourses: CourseStat[];
  topFreeCourses: CourseStat[];
}

export default function Financials({ initialRevenue }: { initialRevenue: number }) {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/stats');
        const stats = await res.json();
        if (res.ok) setData(stats);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">Financial Analytics</h1>
        <p className="page-subtitle">Track revenue, course performance, and growth metrics.</p>
      </div>

      <div className="stat-grid stagger" style={{ marginBottom: '2.5rem' }}>
        <div className="stat-card" style={{ padding: '2rem' }}>
          <div className="stat-icon green" style={{ width: '56px', height: '56px' }}>
            <DollarSign size={32} />
          </div>
          <div>
            <p className="stat-label" style={{ fontSize: '1rem', fontWeight: '600' }}>Total Revenue Inflow</p>
            <p className="stat-value" style={{ fontSize: '2.5rem' }}>${(data?.totalRevenue ?? initialRevenue).toFixed(2)}</p>
            <p style={{ marginTop: '0.5rem', color: 'var(--success-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '700' }}>
               <TrendingUp size={16} /> Standard Growth
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Loader2 className="spin" size={32} style={{ margin: '0 auto' }} />
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Calculating statistics...</p>
        </div>
      ) : data ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
          {/* Top Paid Courses */}
          <div className="solid-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon blue" style={{ width: '40px', height: '40px' }}><DollarSign size={20} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Top 5 Paid Courses</h3>
            </div>
            <div className="form-stack" style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              {data.topPaidCourses.map((course, index) => (
                <div key={course.id} style={{ 
                  padding: '1.25rem', 
                  background: 'var(--bg-base)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: '900', color: 'var(--blue)', fontSize: '1.2rem', opacity: 0.5 }}>#{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
                      <div style={{ opacity: 0.6, fontSize: '0.85rem' }}>${course.price.toFixed(2)} per unit</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{course.enrollments}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Enrollments</div>
                  </div>
                </div>
              ))}
              {!data.topPaidCourses.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No paid courses found.</p>}
            </div>
          </div>

          {/* Top Free Courses */}
          <div className="solid-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="stat-icon orange" style={{ width: '40px', height: '40px' }}><BookOpen size={20} /></div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Top 5 Free Courses</h3>
            </div>
            <div className="form-stack" style={{ gap: '1.5rem', display: 'flex', flexDirection: 'column' }}>
              {data.topFreeCourses.map((course, index) => (
                <div key={course.id} style={{ 
                  padding: '1.25rem', 
                  background: 'var(--bg-base)', 
                  borderRadius: '16px', 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  border: '1px solid var(--surface-border)',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ fontWeight: '900', color: 'var(--orange)', fontSize: '1.2rem', opacity: 0.5 }}>#{index + 1}</div>
                    <div>
                      <div style={{ fontWeight: '600', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{course.title}</div>
                      <div className="badge badge-info" style={{ fontSize: '0.7rem', padding: '0.1rem 0.3rem' }}>FREE</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>{course.enrollments}</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Enrollments</div>
                  </div>
                </div>
              ))}
              {!data.topFreeCourses.length && <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No free courses found.</p>}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
