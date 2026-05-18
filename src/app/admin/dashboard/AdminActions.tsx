'use client';

import { useState } from 'react';
import { Plus, Trash2, Loader2, X, Award, Upload } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  professionName: string;
  enrollments: number;
  cpdPoints: number;
  price: number;
}

interface Profession {
  id: string;
  name: string;
}

export default function AdminActions({ courses: initialCourses, professions }: {
  courses: Course[];
  professions: Profession[];
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [showModal, setShowModal] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    cpdPoints: '',
    professionId: '',
  });
  const [error, setError] = useState('');

  // SCORM Upload State
  const [showScormModal, setShowScormModal] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [scormTitle, setScormTitle] = useState('');
  const [scormFile, setScormFile] = useState<File | null>(null);
  const [uploadingScorm, setUploadingScorm] = useState(false);
  const [scormSuccess, setScormSuccess] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Add new course to local state
      setCourses(prev => [{
        id: data.id,
        title: data.title,
        professionName: data.profession.name,
        enrollments: 0,
        cpdPoints: data.cpdPoints,
        price: data.price,
      }, ...prev]);

      setShowModal(false);
      setFormData({ title: '', description: '', price: '', cpdPoints: '', professionId: '' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This will remove all related enrollments, progress, and certificates.')) {
      return;
    }

    setDeleting(courseId);

    try {
      const res = await fetch(`/api/admin/courses?id=${courseId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setCourses(prev => prev.filter(c => c.id !== courseId));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <section>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Course Performance</h2>
          <button onClick={() => setShowModal(true)} className="btn btn-primary btn-sm">
            <Plus size={16} /> Create Course
          </button>
        </div>

        <div className="solid-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Profession</th>
                <th>Enrollments</th>
                <th>Points</th>
                <th>Price</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{course.title}</td>
                  <td>
                    <span className="badge badge-info">{course.professionName}</span>
                  </td>
                  <td>{course.enrollments}</td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Award size={14} color="var(--success)" /> {course.cpdPoints}
                    </span>
                  </td>
                  <td style={{ fontWeight: '600' }}>Ksh {course.price}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setShowScormModal(true);
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.4rem 0.6rem' }}
                        title="Add SCORM Module"
                      >
                        <Upload size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(course.id)}
                        disabled={deleting === course.id}
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0.4rem 0.6rem' }}
                      >
                        {deleting === course.id ? (
                          <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No courses created yet. Click &quot;Create Course&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create Course Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className="modal-content">
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Create New Course</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Legal Ethics & Professional Conduct"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  className="input"
                  rows={3}
                  placeholder="Describe what this course covers..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  style={{ resize: 'vertical', minHeight: '80px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profession</label>
                <select
                  required
                  className="select"
                  value={formData.professionId}
                  onChange={e => setFormData({ ...formData, professionId: e.target.value })}
                >
                  <option value="" disabled>Select a profession</option>
                  {professions.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Price (USD)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    className="input"
                    placeholder="50.00"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CPD Points</label>
                  <input
                    required
                    type="number"
                    min="1"
                    className="input"
                    placeholder="5"
                    value={formData.cpdPoints}
                    onChange={e => setFormData({ ...formData, cpdPoints: e.target.value })}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className={`btn btn-primary ${creating ? 'btn-loading' : ''}`}
                style={{ marginTop: '0.5rem' }}
              >
                {creating ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Creating...</>
                ) : (
                  <><Plus size={16} /> Create Course</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* SCORM Upload Modal */}
      {showScormModal && (
        <div className="modal-overlay" onClick={(e) => {
          if (e.target === e.currentTarget) setShowScormModal(false);
        }}>
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Add SCORM Lesson</h2>
              <button 
                onClick={() => {
                  setShowScormModal(false);
                  setScormSuccess('');
                  setError('');
                  setScormTitle('');
                  setScormFile(null);
                }} 
                className="btn btn-ghost" style={{ padding: '0.4rem' }}
              >
                <X size={20} />
              </button>
            </div>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
            {scormSuccess && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{scormSuccess}</div>}

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!scormFile || !selectedCourseId) return;

              setUploadingScorm(true);
              setError('');
              setScormSuccess('');

              try {
                // 1. Create Module & Lesson first
                const res1 = await fetch('/api/admin/lessons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ courseId: selectedCourseId, title: scormTitle })
                });

                if (!res1.ok) throw new Error('Failed to create lesson container');
                const lesson = await res1.json();

                // 2. Upload and Extract SCORM zip
                const formData = new FormData();
                formData.append('lessonId', lesson.id);
                formData.append('file', scormFile);

                const res2 = await fetch('/api/admin/scorm/upload', {
                  method: 'POST',
                  body: formData
                });

                if (!res2.ok) {
                  const data = await res2.json();
                  throw new Error(data.error || 'Failed to process SCORM file');
                }

                setScormSuccess('SCORM Lesson added successfully!');
                setScormTitle('');
                setScormFile(null);
              } catch (err: any) {
                setError(err.message);
              } finally {
                setUploadingScorm(false);
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Lesson Title</label>
                <input
                  required
                  className="input"
                  placeholder="e.g. Health & Safety Protocol"
                  value={scormTitle}
                  onChange={e => setScormTitle(e.target.value)}
                  disabled={uploadingScorm}
                />
              </div>

              <div className="form-group">
                <label className="form-label">SCORM Package (.zip)</label>
                <input
                  required
                  type="file"
                  accept=".zip"
                  className="input"
                  style={{ padding: '0.5rem' }}
                  onChange={e => setScormFile(e.target.files?.[0] || null)}
                  disabled={uploadingScorm}
                />
              </div>

              <button
                type="submit"
                disabled={uploadingScorm || !scormFile || !scormTitle}
                className={`btn btn-primary ${uploadingScorm ? 'btn-loading' : ''}`}
                style={{ marginTop: '0.5rem' }}
              >
                {uploadingScorm ? (
                  <><Loader2 size={16} style={{ animation: 'spin 0.6s linear infinite' }} /> Processing...</>
                ) : (
                  <><Upload size={16} /> Upload & Extract</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// Just add this helper function inside the same file for SCORM handling
// We inject it above the render
