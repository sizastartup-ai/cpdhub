'use client';

import { useState } from 'react';
import { 
  Plus, Trash2, Loader2, X, Award, Upload, Edit, ExternalLink, 
  Search, BookOpen, FileText, File as FileIcon, Image as ImageIcon,
  ChevronDown, ChevronRight
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  professionId: string;
  professionName: string;
  totalEnrollments: number;
  ongoingEnrollments: number; // Enrolled but not completed
  cpdPoints: number;
  price: number;
}

interface Profession {
  id: string;
  name: string;
}

export default function CourseManagement({ initialCourses, professions }: {
  initialCourses: Course[];
  professions: Profession[];
}) {
  const [courses, setCourses] = useState(initialCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  // Content Management
  const [showModulesModal, setShowModulesModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  // Generic Add Item Modal
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [itemType, setItemType] = useState<'module' | 'quiz'>('module');
  const [itemName, setItemName] = useState('');
  const [itemParentId, setItemParentId] = useState<string | null>(null);
  const [itemOwnerType, setItemOwnerType] = useState<'module' | 'course'>('course');

  // Confirmation Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState<() => Promise<void>>(() => async () => {});
  const [confirmProcessing, setConfirmProcessing] = useState(false);

  // Module Resources
  const [showResourcesModal, setShowResourcesModal] = useState(false);
  const [selectedModuleResources, setSelectedModuleResources] = useState<any>(null);
  const [resources, setResources] = useState<any[]>([]);
  const [addingResource, setAddingResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceType, setResourceType] = useState('PDF');

  // Edit Module Modal
  const [showEditModuleModal, setShowEditModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState<any>(null);
  const [editModuleData, setEditModuleData] = useState({ title: '', videoUrl: '' });

  // Material Management
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [materialType, setMaterialType] = useState<'Notes' | 'PDF' | 'Image'>('Notes');
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialContent, setMaterialContent] = useState(''); // Text for notes or URL for PDF/Image
  const [materialSuccess, setMaterialSuccess] = useState('');

  const fetchModules = async (courseId: string) => {
    setLoadingModules(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/modules?courseId=${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setModules(data.modules);
        setCourseQuizzes(data.courseQuizzes || []);
      } else if (res.status === 404 || res.status === 400) {
        setShowModulesModal(false);
        setError('Selected course no longer exists.');
      } else {
        throw new Error('Failed to load curriculum');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoadingModules(false);
    }
  };

  const handleOpenConfirm = (title: string, message: string, action: () => Promise<void>) => {
    setConfirmTitle(title);
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleOpenEditModule = (module: any) => {
    setEditingModule(module);
    setEditModuleData({ title: module.title, videoUrl: module.videoUrl || '' });
    setShowEditModuleModal(true);
  };

  const handleSaveModuleEdit = async () => {
    if (!editingModule) return;
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/modules?id=${editingModule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editModuleData),
      });
      if (res.ok) {
        await fetchModules(selectedCourseId!);
        setShowEditModuleModal(false);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update module');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleOpenAddItem = (parentId: string, type: 'module' | 'quiz', ownerType: 'module' | 'course' = 'course') => {
    setItemParentId(parentId);
    setItemType(type);
    setItemOwnerType(ownerType);
    setItemName('');
    setShowAddItemModal(true);
  };

  const handleSaveNewItem = async () => {
    if (!itemName || !itemParentId) return;
    setProcessing(true);
    setError('');
    try {
      if (itemType === 'module') {
        const res = await fetch('/api/admin/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            courseId: itemParentId, 
            title: itemName, 
            order: modules.length + 1,
            videoUrl: '' 
          }),
        });
        if (res.ok) {
          await fetchModules(itemParentId);
          setShowAddItemModal(false);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to create module');
        }
      } else {
        const res = await fetch('/api/admin/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: itemName, 
            moduleId: itemOwnerType === 'module' ? itemParentId : null,
            courseId: itemOwnerType === 'course' ? itemParentId : null,
            passMark: 70
          }),
        });
        if (res.ok) {
          await fetchModules(selectedCourseId!);
          setShowAddItemModal(false);
        } else {
          const data = await res.json();
          setError(data.error || 'Failed to create quiz');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateModuleVideo = async (moduleId: string, videoUrl: string) => {
    setProcessing(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/modules?id=${moduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl }),
      });
      if (res.ok) {
        await fetchModules(selectedCourseId!);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to update video URL');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };


  const handleDelete = async (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course) return;

    let message = 'Are you sure? All data related to this course will be permanently removed.';
    if (course.totalEnrollments > 0) {
      message = `${course.title} already has ${course.totalEnrollments} learners enrolled currently. Are you sure you want to delete this course?`;
    }

    handleOpenConfirm(
      'Delete Course?',
      message,
      async () => {
        setDeleting(courseId);
        try {
          const res = await fetch(`/api/admin/courses?id=${courseId}`, { method: 'DELETE' });
          if (res.ok) setCourses(prev => prev.filter(c => c.id !== courseId));
        } finally {
          setDeleting(null);
          setShowConfirmModal(false);
        }
      }
    );
  };


  const fetchResources = async (moduleId: string) => {
    try {
      const res = await fetch(`/api/admin/resources?moduleId=${moduleId}`);
      const data = await res.json();
      if (res.ok) setResources(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddResource = async () => {
    if (!resourceTitle || !resourceFile) return;
    setAddingResource(true);
    try {
      const formData = new FormData();
      formData.append('file', resourceFile);
      formData.append('moduleId', selectedModuleResources.id);
      formData.append('title', resourceTitle);
      formData.append('type', resourceType);

      const res = await fetch('/api/admin/resources/upload', {
        method: 'POST',
        body: formData
      });
      
      if (res.ok) {
        setResourceTitle('');
        setResourceFile(null);
        // Clear input
        const fileInput = document.getElementById('resource-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        fetchResources(selectedModuleResources.id);
      }
    } finally {
      setAddingResource(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    await fetch(`/api/admin/resources?id=${id}`, { method: 'DELETE' });
    fetchResources(selectedModuleResources.id);
  };

  const handleOpenResources = (m: any) => {
    setSelectedModuleResources(m);
    fetchResources(m.id);
    setShowResourcesModal(true);
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.professionName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description,
        price: course.price.toString(),
        cpdPoints: course.cpdPoints.toString(),
        professionId: course.professionId,
      });
    } else {
      setEditingCourse(null);
      setFormData({ title: '', description: '', price: '', cpdPoints: '', professionId: '' });
    }
    setShowModal(true);
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    cpdPoints: '',
    professionId: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError('');

    const url = editingCourse ? `/api/admin/courses?id=${editingCourse.id}` : '/api/admin/courses';
    const method = editingCourse ? 'PATCH' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (editingCourse) {
        setCourses(prev => prev.map(c => c.id === editingCourse.id ? {
          ...c,
          ...formData,
          price: parseFloat(formData.price),
          cpdPoints: parseInt(formData.cpdPoints),
          professionName: professions.find(p => p.id === formData.professionId)?.name || c.professionName
        } : c));
      } else {
        setCourses(prev => [{
          id: data.id,
          title: data.title,
          description: data.description,
          professionId: data.professionId,
          professionName: data.profession.name,
          totalEnrollments: 0,
          ongoingEnrollments: 0,
          cpdPoints: data.cpdPoints,
          price: data.price,
        }, ...prev]);
      }

      setShowModal(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Lessons/Materials API would be needed here too.
  // For now I'll create a mockup of the material addition.

  return (
    <section>
      <div className="page-header">
        <h1 className="page-title">Course Management</h1>
        <p className="page-subtitle">Create, update, and manage course content.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1 }}>
          <Search size={18} />
          <input 
            placeholder="Search courses..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary">
          <Plus size={18} /> New Course
        </button>
      </div>

      <div className="solid-card" style={{ padding: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Course Title</th>
              <th>Profession</th>
              <th>Status</th>
              <th>Modules</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.map(course => (
              <tr key={course.id}>
                <td style={{ fontWeight: '600' }}>{course.title}</td>
                <td><span className="badge badge-info">{course.professionName}</span></td>
                <td>
                  <span className="badge badge-success">Active</span>
                </td>
                <td>
                  <button 
                    onClick={() => {
                       setSelectedCourseId(course.id);
                       setSelectedCourse(course);
                       setShowModulesModal(true);
                       fetchModules(course.id);
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    Build Content
                  </button>
                </td>
                <td>{course.cpdPoints} pts</td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a href={`/courses/${course.id}`} target="_blank" className="btn btn-ghost btn-sm" title="Preview"><ExternalLink size={16} /></a>
                    <button onClick={() => handleOpenModal(course)} className="btn btn-ghost btn-sm" title="Edit Info"><Edit size={16} /></button>
                    <button 
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowMaterialModal(true);
                      }}
                      className="btn btn-ghost btn-sm"
                      title="Add Material"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(course.id)} 
                      disabled={deleting === course.id}
                      className="btn btn-ghost btn-sm" 
                      style={{ color: 'var(--error)' }}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Modules & Quiz Modal */}
      {showModulesModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div className="modal-header">
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Course Builder: {selectedCourse?.title}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Manage modules, video lectures, and assessments.</p>
              </div>
              <button 
                onClick={() => setShowModulesModal(false)} 
                className="btn btn-ghost" 
              ><X /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              {loadingModules ? (
                <div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="spin" size={32} /></div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                  {/* Course Quizzes */}
                  <div className="solid-card" style={{ background: 'rgba(59, 130, 246, 0.04)', borderColor: 'var(--primary-light)', padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <div>
                         <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Final Course Exams</h3>
                         <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>These must be completed after all modules.</p>
                      </div>
                      <button onClick={() => handleOpenAddItem(selectedCourseId!, 'quiz', 'course')} className="btn btn-primary btn-sm">Add Final Quiz</button>
                    </div>
                    <div style={{ display: 'grid', gap: '0.75rem', marginTop: '1rem' }}>
                      {courseQuizzes.length === 0 && (
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1rem' }}>No final quizzes added.</p>
                      )}
                      {courseQuizzes.map((q: any) => (
                        <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                             <Award size={16} color="var(--primary)" />
                             <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>{q.title} ({q.passMark}%)</span>
                          </div>
                          <button 
                            onClick={() => handleOpenConfirm(
                              'Delete Quiz?',
                              `Delete final quiz "${q.title}"?`,
                              async () => {
                                await fetch(`/api/admin/quizzes?id=${q.id}`, { method: 'DELETE' });
                                fetchModules(selectedCourseId!);
                                setShowConfirmModal(false);
                              }
                            )}
                            className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}
                          ><Trash2 size={16} /></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Modules List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Learning Modules</h3>
                      <button onClick={() => handleOpenAddItem(selectedCourseId!, 'module')} className="btn btn-secondary btn-sm">Add Module</button>
                    </div>

                    {modules.map((m, i) => (
                      <div key={m.id} className="solid-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div>
                            <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--primary)', textTransform: 'uppercase' }}>Module {i+1}</span>
                            <h4 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{m.title}</h4>
                          </div>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button 
                              onClick={() => handleOpenResources(m)}
                              className="btn btn-ghost btn-sm"
                              title="Learning Resources"
                              style={{ color: 'var(--primary-light)' }}
                            ><FileText size={16} /></button>
                            <button 
                              onClick={() => handleOpenEditModule(m)}
                              className="btn btn-ghost btn-sm"
                              title="Edit Module"
                            ><Edit size={16} /></button>
                            <button 
                              onClick={() => handleOpenConfirm(
                                'Delete Module?',
                                `Are you sure you want to delete module "${m.title}"?`,
                                async () => {
                                  await fetch(`/api/admin/modules?id=${m.id}`, { method: 'DELETE' });
                                  fetchModules(selectedCourseId!);
                                  setShowConfirmModal(false);
                                }
                              )}
                              className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}
                              title="Delete Module"
                            ><Trash2 size={16} /></button>
                          </div>
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                          <label className="form-label" style={{ fontSize: '0.7rem' }}>Master Video URL</label>
                          <div style={{ display: 'flex', gap: '1rem' }}>
                             <input 
                               className="input" 
                               value={m.videoUrl || ''} 
                               readOnly
                               placeholder="Edit module to set video URL..."
                             />
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <button onClick={() => handleOpenAddItem(m.id, 'quiz', 'module')} className="btn btn-ghost btn-sm" style={{ background: 'var(--bg-tertiary)', fontWeight: '700' }}>
                               Add Module Quiz
                            </button>
                          </div>
                          
                          {m.quizzes && m.quizzes.length > 0 && (
                            <div style={{ display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                              {m.quizzes.map((q: any) => (
                                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <FileText size={14} color="var(--primary-light)" />
                                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{q.title} ({q.passMark}%)</span>
                                   </div>
                                   <button 
                                      onClick={() => handleOpenConfirm(
                                        'Delete Quiz?',
                                        `Delete module quiz "${q.title}"?`,
                                        async () => {
                                          await fetch(`/api/admin/quizzes?id=${q.id}`, { method: 'DELETE' });
                                          fetchModules(selectedCourseId!);
                                          setShowConfirmModal(false);
                                        }
                                      )}
                                      className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}
                                    ><Trash2 size={14} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {modules.length === 0 && (
                      <div className="empty-state" style={{ padding: '4rem' }}>
                        <p>No modules created yet. Start by adding your first learning module.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Generic Add Item Modal (Replacement for prompt) */}
      {showAddItemModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '400px', animation: 'scaleIn 0.2s ease-out' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1rem', fontWeight: '800' }}>Add New {itemType === 'module' ? 'Module' : 'Quiz'}</h3>
              <button onClick={() => setShowAddItemModal(false)} className="btn btn-ghost"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">Title / Name</label>
                <input 
                  autoFocus
                  className="input" 
                  placeholder={`Enter ${itemType} title...`} 
                  value={itemName}
                  onChange={e => setItemName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveNewItem()}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button 
                  disabled={processing || !itemName} 
                  onClick={handleSaveNewItem} 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                  {processing ? <Loader2 size={18} className="spin" /> : 'Create'}
                </button>
                <button onClick={() => setShowAddItemModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>{confirmTitle}</h3>
            </div>
            <div className="modal-body" style={{ padding: '1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{confirmMessage}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                 <button 
                  disabled={processing}
                  onClick={confirmAction} 
                  className="btn btn-primary" 
                  style={{ flex: 1, background: 'var(--error)' }}
                 >
                   {processing ? <Loader2 size={18} className="spin" /> : 'Confirm'}
                 </button>
                 <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Module Modal */}
      {showEditModuleModal && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800' }}>Edit Module</h3>
              <button onClick={() => setShowEditModuleModal(false)} className="btn btn-ghost"><X /></button>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              <div className="form-stack">
                <div className="form-group">
                  <label className="form-label">Module Title</label>
                  <input 
                    className="input"
                    value={editModuleData.title}
                    onChange={e => setEditModuleData({...editModuleData, title: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Video URL (YouTube/Vimeo)</label>
                  <input 
                    className="input"
                    value={editModuleData.videoUrl}
                    placeholder="https://youtube.com/..."
                    onChange={e => setEditModuleData({...editModuleData, videoUrl: e.target.value})}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button 
                  disabled={processing}
                  onClick={handleSaveModuleEdit} 
                  className="btn btn-primary" 
                  style={{ flex: 1 }}
                >
                   {processing ? <Loader2 size={18} className="spin" /> : 'Save Changes'}
                </button>
                <button onClick={() => setShowEditModuleModal(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Course Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingCourse ? 'Update Course Details' : 'Design New Course'}</h2>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              {error && <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>{error}</div>}
              
              <form onSubmit={handleSubmit} className="form-stack">
                <div className="form-group">
                  <label className="form-label">Course Title</label>
                  <input 
                    required 
                    className="input" 
                    placeholder="e.g. Advanced Legal Ethics"
                    value={formData.title} 
                    onChange={e=>setFormData({...formData, title: e.target.value})} 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Course Description</label>
                  <textarea 
                    required 
                    className="input" 
                    rows={4} 
                    placeholder="Describe the learning objectives..."
                    value={formData.description} 
                    onChange={e=>setFormData({...formData, description: e.target.value})} 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Target Profession</label>
                  <select 
                    required 
                    className="select" 
                    value={formData.professionId} 
                    onChange={e=>setFormData({...formData, professionId: e.target.value})}
                  >
                    <option value="">Select a category</option>
                    {professions.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Enrollment Price ($)</label>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      className="input" 
                      placeholder="0.00 for FREE"
                      value={formData.price} 
                      onChange={e=>setFormData({...formData, price: e.target.value})} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CPD Point Value</label>
                    <input 
                      type="number" 
                      required 
                      className="input" 
                      placeholder="5"
                      value={formData.cpdPoints} 
                      onChange={e=>setFormData({...formData, cpdPoints: e.target.value})} 
                    />
                  </div>
                </div>
                
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <button disabled={processing} className="btn btn-primary" style={{ flex: 1 }}>
                    {processing ? <Loader2 size={18} className="spin" /> : editingCourse ? 'Update Course' : 'Create Course'}
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Materials Modal */}
      {showMaterialModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add Professional Materials</h2>
              <button onClick={() => setShowMaterialModal(false)} className="btn btn-ghost" style={{ padding: '0.5rem' }}><X /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div className="tabs" style={{ marginBottom: '2rem' }}>
                <button className={`tab-btn ${materialType === 'Notes' ? 'active' : ''}`} onClick={()=>setMaterialType('Notes')}>Study Notes</button>
                <button className={`tab-btn ${materialType === 'PDF' ? 'active' : ''}`} onClick={()=>setMaterialType('PDF')}>PDF Resource</button>
                <button className={`tab-btn ${materialType === 'Image' ? 'active' : ''}`} onClick={()=>setMaterialType('Image')}>Graphic/Image</button>
              </div>

              {materialSuccess && <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>{materialSuccess}</div>}

              <div className="form-stack">
                <div className="form-group">
                  <label className="form-label">Material Title</label>
                  <input 
                    className="input" 
                    value={materialTitle} 
                    onChange={e=>setMaterialTitle(e.target.value)} 
                    placeholder="Title for this learning material" 
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">{materialType === 'Notes' ? 'Markdown/Text Content' : 'Public Asset URL'}</label>
                  {materialType === 'Notes' ? (
                    <textarea 
                      className="input" 
                      rows={6} 
                      value={materialContent} 
                      onChange={e=>setMaterialContent(e.target.value)} 
                      placeholder="Write your notes here..."
                    />
                  ) : (
                    <input 
                      className="input" 
                      value={materialContent} 
                      onChange={e=>setMaterialContent(e.target.value)} 
                      placeholder="e.g. https://s3.amazonaws.com/your-bucket/file.pdf" 
                    />
                  )}
                </div>

                <div style={{ 
                  padding: '1rem', 
                  background: 'var(--bg-base)', 
                  borderRadius: 'var(--radius-md)', 
                  marginBottom: '1.5rem',
                  borderLeft: '4px solid var(--primary)'
                }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Note:</strong> To upload SCORM (.zip) packages, please use the dedicated <strong>SCORM Upload</strong> button next to the Trash icon in the main table.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    disabled={processing || !materialTitle} 
                    onClick={async () => {
                       setProcessing(true);
                       try {
                         const res = await fetch('/api/admin/lessons', {
                           method: 'POST',
                           headers: { 'Content-Type': 'application/json' },
                           body: JSON.stringify({ 
                             courseId: selectedCourseId, 
                             title: materialTitle,
                             contentType: materialType === 'Notes' ? 'Text' : materialType,
                             contentUrl: materialContent 
                           })
                         });
                         if (res.ok) {
                           setMaterialSuccess('Material linked successfully!');
                           setMaterialTitle('');
                           setMaterialContent('');
                           setTimeout(() => {
                             setMaterialSuccess('');
                             setShowMaterialModal(false);
                           }, 1500);
                         }
                       } finally {
                         setProcessing(false);
                       }
                    }} 
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    {processing ? <Loader2 size={18} className="spin" /> : 'Save Material'}
                  </button>
                  <button onClick={() => setShowMaterialModal(false)} className="btn btn-secondary">
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Resources Modal for Module */}
      {showResourcesModal && selectedModuleResources && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                 <h2>Module Resources</h2>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>Manage PDFs, Presentations, and Images for <strong>{selectedModuleResources.title}</strong></p>
              </div>
              <button onClick={() => setShowResourcesModal(false)} className="btn btn-ghost"><X /></button>
            </div>
            
            <div className="modal-body" style={{ padding: '2rem' }}>
              <div className="solid-card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '1px dashed var(--border)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '1rem', textTransform: 'uppercase' }}>Add New Resource</h4>
                <div className="form-stack">
                  <div className="form-group">
                    <label className="form-label">Resource Title</label>
                    <input className="input" value={resourceTitle} onChange={e=>setResourceTitle(e.target.value)} placeholder="e.g. Module 1 - Lecture Slides" />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                       <label className="form-label">Resource Type</label>
                       <select className="input" value={resourceType} onChange={e=>setResourceType(e.target.value)}>
                         <option>PDF</option>
                         <option>Presentation</option>
                         <option>Image</option>
                         <option>Other</option>
                       </select>
                    </div>
                    <div className="form-group">
                       <label className="form-label">Instructional File</label>
                       <input 
                         id="resource-file-input"
                         type="file" 
                         className="input" 
                         onChange={e=>setResourceFile(e.target.files?.[0] || null)}
                       />
                    </div>
                  </div>
                  <button 
                    disabled={addingResource || !resourceTitle || !resourceFile}
                    onClick={handleAddResource} 
                    className="btn btn-primary" 
                    style={{ width: '100%', marginTop: '0.5rem' }}
                  >
                    {addingResource ? <Loader2 className="spin" size={20} /> : <><Plus size={18} /> Upload Resource</>}
                  </button>
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '1rem' }}>Current Resources</h4>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {resources.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '2rem' }}>No resources linked to this module yet.</p>}
                {resources.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-base)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {r.type === 'PDF' && <FileText size={20} color="var(--error)" />}
                      {r.type === 'Presentation' && <FileIcon size={20} color="var(--primary)" />}
                      {r.type === 'Image' && <ImageIcon size={20} color="#22c55e" />}
                      {r.type === 'Other' && <FileIcon size={20} color="var(--text-dim)" />}
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{r.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.type}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteResource(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="modal-footer">
              <button onClick={() => setShowResourcesModal(false)} className="btn btn-secondary" style={{ width: '100%' }}>Done</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay" style={{ zIndex: 1400 }}>
          <div className="modal-content" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="modal-header" style={{ justifyContent: 'center', border: 'none' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '900' }}>{confirmTitle}</h2>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>{confirmMessage}</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={async () => {
                    setConfirmProcessing(true);
                    try {
                      await confirmAction();
                      setShowConfirmModal(false);
                    } finally {
                      setConfirmProcessing(false);
                    }
                  }} 
                  disabled={confirmProcessing}
                  className="btn btn-primary btn-lg" 
                  style={{ flex: 1, background: 'var(--error)' }}
                >
                  {confirmProcessing ? <Loader2 className="spin" size={18} /> : 'Yes, Delete'}
                </button>
                <button onClick={() => setShowConfirmModal(false)} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
