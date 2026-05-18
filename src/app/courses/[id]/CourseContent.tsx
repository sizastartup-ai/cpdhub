'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Play, CheckCircle, ChevronLeft, Award, HelpCircle, 
  Lock, Loader2, CreditCard, BookOpen, AlertCircle, X, SkipForward,
  FileText, File as FileIcon, Image as ImageIcon, ExternalLink,
  Download, Share2, Clipboard, Heart
} from 'lucide-react';
import jsPDF from 'jspdf';
import ModularVideoPlayer from './ModularVideoPlayer';

interface Question {
  id: string;
  text: string;
  type: string;
  options: string; // JSON string
}

interface Quiz {
  id: string;
  title: string;
  passMark: number;
  questions?: Question[];
}

interface Lesson {
  id: string;
  title: string;
  contentType: string;
  contentUrl: string;
  order: number;
}

interface Module {
  id: string;
  title: string;
  videoUrl: string | null;
  order: number;
  lessons: Lesson[];
  quizzes: Quiz[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  cpdPoints: number;
  price: number;
  profession: string;
  modules: Module[];
  quizzes: Quiz[]; // Course level quizzes
}

interface Props {
  course: Course;
  isEnrolled: boolean;
  completedLessonIds: string[];
  completedModuleIds: string[];
  progressPercentage: number;
  totalLessons: number;
  completedCount: number;
  userRole: string;
  enrollmentStatus: string;
  userName: string;
}

export default function CourseContent({
  course,
  isEnrolled: initialEnrolled,
  completedLessonIds: initialCompleted,
  completedModuleIds: initialCompletedModules,
  progressPercentage: initialProgress,
  totalLessons,
  completedCount: initialCount,
  userRole,
  enrollmentStatus: initialStatus,
  userName,
}: Props) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [activeModule, setActiveModule] = useState<Module | null>(course.modules[0] || null);
  const [completedModuleIds, setCompletedModuleIds] = useState<string[]>(initialCompletedModules || []);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState<Quiz | null>(null);
  
  const [bottomTab, setBottomTab] = useState<'notes' | 'pdfs' | 'images'>('notes');

  const [completing, setCompleting] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showSuccess, setShowSuccess] = useState('');
  const [error, setError] = useState('');
  const [unenrolling, setUnenrolling] = useState(false);
  const [showUnenrollConfirm, setShowUnenrollConfirm] = useState(false);
  const [showGatingModal, setShowGatingModal] = useState(false);
  const [gatingMessage, setGatingMessage] = useState('');

  // Gating States
  const [allowCompletion, setAllowCompletion] = useState(true); // Temporarily true for testing
  const [enrollmentStatus, setEnrollmentStatus] = useState(initialStatus);
  const [isCompleted, setIsCompleted] = useState(initialStatus === 'Completed');
  const [showNextPrompt, setShowNextPrompt] = useState(false);

  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);
  const [quizResult, setQuizResult] = useState<{ passed: boolean; score: number } | null>(null);

  const [certificate, setCertificate] = useState<any>(null);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [showCertModal, setShowCertModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Reset gating on module switch
  useEffect(() => {
    setAllowCompletion(false);
    setIsCompleted(completedModuleIds.includes(activeModule?.id || ''));
    setShowNextPrompt(false);
    setError('');

    if (activeModule) {
      const fetchModResources = async () => {
        setLoadingResources(true);
        try {
          const res = await fetch(`/api/resources?moduleId=${activeModule.id}`);
          const data = await res.json();
          if (res.ok) setResources(data);
        } finally {
          setLoadingResources(false);
        }
      };
      fetchModResources();
    }
  }, [activeModule, completedModuleIds]);

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Enable completion button 10 seconds before end
    if (duration > 0 && duration - currentTime <= 10) {
      setAllowCompletion(true);
    }
  };

  const handleModuleSelection = (m: Module) => {
    // ALWAYS Allow switching to PREVIOUS/COMPLETED modules or current one
    if (m.id === activeModule?.id || completedModuleIds.includes(m.id) || m.order <= (activeModule?.order || 0)) {
        setActiveModule(m);
        return;
    }

    // Is it a LATER module? Check if current is completed.
    if (!isCompleted && m.order > (activeModule?.order || 0)) {
        setGatingMessage(`Please complete your current module "${activeModule?.title}" first. This ensures you master the prerequisite concepts before moving on.`);
        setShowGatingModal(true);
        return;
    }

    // Allow switching if the current module is officially completed or it's just the next one
    setActiveModule(m);
  };

  const handleUnenroll = async () => {
    setUnenrolling(true);
    try {
      const res = await fetch('/api/enrollments/unenroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id }),
      });
      if (res.ok) {
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUnenrolling(false);
      setShowUnenrollConfirm(false);
    }
  };

  const handleModuleCompleted = async () => {
    if (!activeModule) return;
    setCompleting(true);
    setError('');
    
    try {
      const res = await fetch('/api/enrollments/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: activeModule.id, courseId: course.id }),
      });
      
      const data = await res.json();
      if (res.ok) {
        setIsCompleted(true);
        setCompletedModuleIds(prev => [...prev, activeModule.id]);
        if (data.status) {
           setEnrollmentStatus(data.status);
           if (data.status === 'Completed') setIsCompleted(true);
        }
        // Delay to ensure state sync before showing modal
        setTimeout(() => setShowNextPrompt(true), 200);
      } else {
        setError(data.error || 'Failed to sync progress. Please refresh.');
      }
    } catch (err: any) {
      setError('Connection error. Please check your internet.');
      console.error(err);
    } finally {
      setCompleting(false);
    }
  };

  const handleQuizSubmit = async () => {
     if (!showQuiz) return;
     setSubmittingQuiz(true);
     try {
        const res = await fetch(`/api/quizzes/${showQuiz.id}`, {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ answers }),
        });
        const data = await res.json();
        if (res.ok) {
           setQuizResult(data);
           if (data.passed) {
              setEnrollmentStatus('Completed');
              setShowSuccess(`Congratulations! You passed the assessment with ${Math.round(data.score)}%.`);
           }
        }
     } catch (err) {
        setError('Failed to submit quiz.');
     } finally {
        setSubmittingQuiz(false);
     }
  };

  const generateCertificate = async () => {
     setGeneratingCert(true);
     try {
        const res = await fetch('/api/certificates/generate', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ courseId: course.id }),
        });
        const data = await res.json();
        if (res.ok) {
           setCertificate(data);
           setShowCertModal(true);
        } else {
           setError(data.error || 'Failed to generate certificate.');
        }
     } catch (err) {
        setError('Failed to connect to certificate service.');
     } finally {
        setGeneratingCert(false);
     }
  };

  const downloadPDF = () => {
    if (!certificate) return;
    
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Design the certificate
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();

    // Background and Border
    doc.setFillColor(15, 23, 42); // var(--bg-secondary)
    doc.rect(0, 0, width, height, 'F');
    
    doc.setDrawColor(59, 130, 246); // var(--primary)
    doc.setLineWidth(2);
    doc.rect(10, 10, width - 20, height - 20, 'S');

    // Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.text('CERTIFICATE OF COMPLETION', width / 2, 45, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // var(--text-muted)
    doc.text('This is to certify that', width / 2, 65, { align: 'center' });

    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(59, 130, 246);
    doc.text(userName.toUpperCase(), width / 2, 85, { align: 'center' });

    doc.setFontSize(16);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('has successfully completed the course', width / 2, 105, { align: 'center' });

    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(course.title, width / 2, 120, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    // Using RGB format for jsPDF setTextColor
    doc.setTextColor(34, 197, 94); // #22c55e (success green)
    doc.text(`Earned ${course.cpdPoints} CPD Points`, width / 2, 135, { align: 'center' });

    // QR Code
    if (certificate.qrCodeUrl) {
       doc.addImage(certificate.qrCodeUrl, 'PNG', width / 2 - 20, 150, 40, 40);
    }

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // var(--text-dim)
    doc.text(`Certificate ID: ${certificate.certificateUuid}`, width / 2, 195, { align: 'center' });
    doc.text(`Verified at ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify/${certificate.certificateUuid}`, width / 2, 202, { align: 'center' });

    doc.save(`CPDHub_Certificate_${course.title.replace(/\s+/g, '_')}.pdf`);
  };

  const nextModule = course.modules
    .filter(m => m.order > (activeModule?.order || 0))
    .sort((a, b) => a.order - b.order)[0];

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch('/api/payments/create-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, provider: 'Demo' }),
      });
      if (res.ok) {
        setIsEnrolled(true);
        setShowSuccess('Successfully enrolled! Start learning below.');
        setTimeout(() => setShowSuccess(''), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEnrolling(false);
    }
  };

  const currentVideoUrl = activeModule?.videoUrl;
  const isEmbeddable = currentVideoUrl?.includes('youtube.com') || currentVideoUrl?.includes('vimeo.com');
  
  // Transform YouTube URL to embed
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('vimeo.com/')) {
        const id = url.split('/').pop();
        return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-deep)' }}>
      <header style={{
        height: '64px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 2rem', justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Link href="/courses" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          <ChevronLeft size={20} /> Back
        </Link>
        <h1 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: '800' }}>{course.title}</h1>
        <div style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
          <Award size={18} /> {course.cpdPoints} CPD Points
        </div>
      </header>

      {showSuccess && <div className="alert alert-success" style={{ margin: 0, borderRadius: 0 }}>{showSuccess}</div>}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto', background: 'var(--bg-deep)' }}>
          {!isEnrolled ? (
            <div style={{ maxWidth: '500px', textAlign: 'center', padding: '5rem 2rem', margin: '0 auto' }}>
              <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                <Lock size={36} color="var(--primary)" />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Premium Course</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{course.description}</p>
              <button onClick={handleEnroll} disabled={enrolling} className="btn btn-primary btn-lg" style={{ width: '100%' }}>
                Enroll for ${course.price}
              </button>
            </div>
          ) : (
            <div style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '3rem' }}>
              <div style={{ marginBottom: '2rem' }}>
                 <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Module {activeModule?.order}</span>
                 <h2 style={{ fontSize: '2rem', fontWeight: '900', letterSpacing: '-0.02em' }}>{activeModule?.title}</h2>
              </div>

              {/* Custom Modular Video Player */}
              <div style={{ 
                width: '100%', 
                aspectRatio: '16/9', 
                background: '#000', 
                borderRadius: 'var(--radius-xl)', 
                overflow: 'hidden',
                border: '1px solid var(--surface-border)',
                boxShadow: 'var(--shadow-2xl)',
                position: 'relative',
                marginBottom: '2.5rem'
              }}>
                {activeModule?.videoUrl ? (
                   <ModularVideoPlayer 
                      url={activeModule.videoUrl}
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => setAllowCompletion(true)}
                   />
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', textAlign: 'center' }}>
                     <Play size={64} style={{ opacity: 0.2 }} />
                     <p style={{ color: 'var(--text-muted)', fontWeight: '600' }}>This module does not have a video lecture yet.</p>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                 {error && (
                    <div className="alert alert-error" style={{ borderRadius: 'var(--radius-lg)', margin: 0 }}>
                       <AlertCircle size={18} /> {error}
                    </div>
                 )}
                 
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--surface-border)' }}>
                    <div style={{ display: 'flex', gap: '2rem' }}>
                       <div>
                          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800' }}>LEARNING PROGRESS</p>
                          <p style={{ fontSize: '0.9rem', fontWeight: '700' }}>{isCompleted ? 'Module Successfully Finished' : 'Syncing real-time video progress...'}</p>
                       </div>
                       {activeModule?.quizzes && activeModule.quizzes.length > 0 && (
                         <div style={{ borderLeft: '1px solid var(--surface-border)', paddingLeft: '2rem' }}>
                            <p style={{ fontSize: '0.7rem', color: 'var(--warning)', fontWeight: '800' }}>ASSESSMENT READY</p>
                            <button onClick={()=>setShowQuiz(activeModule.quizzes[0])} className="btn-link" style={{ color: 'var(--warning)', fontSize: '0.9rem', fontWeight: '800' }}>Take Module Quiz</button>
                         </div>
                       )}
                    </div>
                    <button 
                     disabled={!allowCompletion || completing || isCompleted} 
                     onClick={handleModuleCompleted} 
                     className="btn"
                     style={{ 
                       minWidth: '240px',
                       background: isCompleted ? 'var(--success)' : (allowCompletion ? 'var(--primary)' : 'rgba(255,255,255,0.05)'),
                       color: isCompleted || allowCompletion ? '#fff' : 'var(--text-dim)',
                       cursor: allowCompletion && !isCompleted ? 'pointer' : 'default',
                       border: 'none',
                       display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center',
                       boxShadow: allowCompletion && !isCompleted ? '0 0 20px rgba(59,130,246,0.3)' : 'none',
                       transform: allowCompletion && !isCompleted ? 'scale(1.05)' : 'none',
                       transition: 'all 0.3s'
                     }}
                   >
                      {completing ? <Loader2 className="spin" size={18} /> : (
                         isCompleted ? (
                           <> <CheckCircle size={18} /> Module Completed </>
                         ) : (
                           allowCompletion ? (
                              <> <Play size={18} /> Mark as Completed </>
                           ) : (
                              <> <Lock size={16} /> Locked (Finish Video) </>
                           )
                         )
                      )}
                   </button>
                 </div>
              </div>

              {/* Tabs Section */}
              <div className="solid-card" style={{ padding: '2.5rem' }}>
                <div className="tabs" style={{ marginBottom: '2.5rem', gap: '3rem' }}>
                  <button className={`tab-btn ${bottomTab === 'notes' ? 'active' : ''}`} onClick={()=>setBottomTab('notes')}>Lecture Notes</button>
                  <button className={`tab-btn ${bottomTab === 'pdfs' ? 'active' : ''}`} onClick={()=>setBottomTab('pdfs')}>Resources</button>
                </div>

                <div style={{ minHeight: '300px' }}>
                  {bottomTab === 'notes' && (
                    <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                      <p>Module lecture notes and highlights will appear here. These are designed to help you catch the key points from the video lecture.</p>
                    </div>
                  )}
                  {bottomTab === 'pdfs' && (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                       {loadingResources && <Loader2 className="spin" size={24} style={{ margin: '2rem auto' }} />}
                       {!loadingResources && resources.length === 0 && (
                          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                             No additional resources for this module yet.
                          </p>
                       )}
                       {!loadingResources && resources.map(r => (
                          <a 
                             key={r.id}
                             href={r.url}
                             download={r.title}
                             target="_blank"
                             rel="noreferrer"
                             className="solid-card"
                             style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '1rem', 
                                padding: '1.25rem',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                                border: '1px solid var(--border-light)'
                             }}
                          >
                             <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {r.type === 'PDF' && <FileText size={20} color="var(--error)" />}
                                {r.type === 'Presentation' && <FileIcon size={20} color="var(--primary)" />}
                                {r.type === 'Image' && <ImageIcon size={20} color="#22c55e" />}
                                {!['PDF', 'Presentation', 'Image'].includes(r.type) && <FileIcon size={20} />}
                             </div>
                             <div style={{ flex: 1 }}>
                                <h5 style={{ fontWeight: '700', fontSize: '0.95rem', color: 'white', marginBottom: '0.2rem' }}>{r.title}</h5>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{r.type} Resource</p>
                             </div>
                             <ExternalLink size={16} color="var(--text-dim)" />
                          </a>
                       ))}
                    </div>
                  )}
                </div>
              </div>

              {/* End of Course Section */}
              {enrollmentStatus === 'Completed' ? (
                 <div style={{ marginTop: '5rem', padding: '5rem', textAlign: 'center', background: 'rgba(34, 197, 94, 0.05)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--success)' }}>
                    <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                       <Award size={64} color="var(--success)" />
                    </div>
                    <h3 style={{ fontSize: '2.25rem', fontWeight: '900', marginBottom: '1.5rem' }}>Congratulations, {userName}!</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto 3rem', lineHeight: '1.6' }}>
                       You have successfully mastered <strong>{course.title}</strong> and earned <strong>{course.cpdPoints} CPD Points</strong>. Your dedication to professional growth is commendable.
                    </p>
                    <button 
                       onClick={generateCertificate} 
                       disabled={generatingCert}
                       className="btn btn-primary btn-lg" 
                       style={{ minWidth: '320px', padding: '1.5rem 3rem', fontSize: '1.25rem', gap: '1rem' }}
                    >
                       {generatingCert ? <Loader2 className="spin" /> : <><Award size={24} /> Generate Official Certificate</>}
                    </button>
                 </div>
              ) : (
                course.quizzes && course.quizzes.length > 0 && (
                  <div style={{ marginTop: '5rem', padding: '4rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)', borderRadius: 'var(--radius-2xl)', border: '1px dashed var(--primary-light)' }}>
                     <Award size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem', margin: '0 auto' }} />
                     <h3 style={{ fontSize: '1.75rem', fontWeight: '900', marginBottom: '1rem' }}>Final Course Assessment</h3>
                     <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem' }}>You have reached the end of the course. To earn your {course.cpdPoints} CPD points, you must pass the final examination.</p>
                     <button onClick={()=>setShowQuiz(course.quizzes[0])} className="btn btn-primary btn-lg" style={{ paddingLeft: '3rem', paddingRight: '3rem' }}>Start Final Exam</button>
                  </div>
                )
              )}
            </div>
          )}
        </main>

        <aside style={{ width: '380px', background: 'var(--bg-base)', borderLeft: '1px solid var(--border)', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
           <div style={{ padding: '2rem', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Course Modules</h2>
           </div>
           <div style={{ flex: 1 }}>
              {course.modules.map((m) => (
                <div 
                  key={m.id} 
                  onClick={() => isEnrolled && handleModuleSelection(m)}
                  style={{
                    padding: '1.5rem 2rem',
                    borderBottom: '1px solid var(--border-light)',
                    cursor: isEnrolled ? 'pointer' : 'default',
                    background: activeModule?.id === m.id ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                    borderLeft: activeModule?.id === m.id ? '4px solid var(--primary)' : '4px solid transparent',
                    opacity: isEnrolled ? (completedModuleIds.includes(m.id) || m.id === activeModule?.id ? 1 : 0.45) : 0.4,
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                     <div>
                        <p style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-dim)' }}>MODULE {m.order}</p>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginTop: '0.25rem', color: completedModuleIds.includes(m.id) ? 'var(--success)' : 'inherit' }}>
                           {m.title} {completedModuleIds.includes(m.id) && '✓'}
                        </h4>
                     </div>
                     {completedModuleIds.includes(m.id) ? (
                        <CheckCircle size={18} color="var(--success)" />
                     ) : (
                        activeModule?.id === m.id ? <Play size={18} color="var(--primary)" /> : <Lock size={16} color="var(--text-dim)" />
                     )}
                  </div>
                </div>
              ))}
           </div>
           <div style={{ padding: '2rem', marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
               <button onClick={() => setShowUnenrollConfirm(true)} className="btn btn-ghost" style={{ width: '100%', color: 'var(--error)', fontSize: '0.85rem', fontWeight: '800' }}>
                  Un-enroll from Course
               </button>
            </div>
        </aside>
      </div>

      {showQuiz && (
        <div className="modal-overlay">
           <div className="modal-content" style={{ maxWidth: '800px' }}>
              <div className="modal-header">
                 <h2>{showQuiz.title}</h2>
                 <button onClick={()=>{
                    setShowQuiz(null);
                    setQuizStarted(false);
                    setQuizResult(null);
                    setAnswers({});
                    setCurrentQuestionIndex(0);
                 }} className="btn btn-ghost"><X /></button>
              </div>
              <div className="modal-body" style={{ padding: '3rem' }}>
                 {!quizStarted ? (
                    <div style={{ textAlign: 'center' }}>
                       <HelpCircle size={64} style={{ color: 'var(--primary)', marginBottom: '1.5rem', margin: '0 auto' }} />
                       <h3 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '1rem' }}>Ready to Begin?</h3>
                       <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.1rem' }}>
                          This assessment will evaluate your understanding of the course material. 
                          You need to score at least <strong>{showQuiz.passMark}%</strong> to pass.
                       </p>
                       <button onClick={() => setQuizStarted(true)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>Start Examination</button>
                    </div>
                 ) : quizResult ? (
                    <div style={{ textAlign: 'center' }}>
                       <div style={{ 
                          width: '80px', height: '80px', borderRadius: '50%', 
                          background: quizResult.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' 
                       }}>
                          {quizResult.passed ? <CheckCircle size={48} color="var(--success)" /> : <X size={48} color="var(--error)" />}
                       </div>
                       <h3 style={{ fontSize: '2rem', fontWeight: '900', marginBottom: '1rem' }}>
                          {quizResult.passed ? 'Assessment Passed!' : 'Assessment Failed'}
                       </h3>
                       <p style={{ fontSize: '3.5rem', fontWeight: '900', color: quizResult.passed ? 'var(--success)' : 'var(--error)', marginBottom: '0.5rem' }}>
                          {Math.round(quizResult.score)}%
                       </p>
                       <p style={{ color: 'var(--text-muted)', marginBottom: '3rem' }}>
                          Required Score: {showQuiz.passMark}%
                       </p>
                       <div style={{ display: 'flex', gap: '1rem' }}>
                          {quizResult.passed ? (
                             <button onClick={() => setShowQuiz(null)} className="btn btn-primary btn-lg" style={{ flex: 1 }}>Return to Course</button>
                          ) : (
                             <button onClick={() => {
                                setQuizResult(null);
                                setQuizStarted(true);
                                setAnswers({});
                                setCurrentQuestionIndex(0);
                             }} className="btn btn-primary btn-lg" style={{ flex: 1 }}>Retry Assessment</button>
                          )}
                          <button onClick={() => setShowQuiz(null)} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>Close</button>
                       </div>
                    </div>
                 ) : (
                   <div>
                      {showQuiz.questions && showQuiz.questions[currentQuestionIndex] ? (
                         <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2.5rem', alignItems: 'center' }}>
                               <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--primary)', letterSpacing: '0.1em' }}>QUESTION {currentQuestionIndex + 1} OF {showQuiz.questions.length}</span>
                               <div style={{ width: '150px', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div style={{ width: `${((currentQuestionIndex + 1) / showQuiz.questions.length) * 100}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
                               </div>
                            </div>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '2.5rem', lineHeight: '1.5' }}>{showQuiz.questions[currentQuestionIndex].text}</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                               {JSON.parse(showQuiz.questions[currentQuestionIndex].options || '[]').map((opt: string, idx: number) => (
                                  <button
                                     key={idx}
                                     onClick={() => setAnswers({ ...answers, [showQuiz.questions![currentQuestionIndex].id]: opt })}
                                     style={{
                                        padding: '1.5rem',
                                        textAlign: 'left',
                                        background: answers[showQuiz.questions![currentQuestionIndex].id] === opt ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.02)',
                                        border: answers[showQuiz.questions![currentQuestionIndex].id] === opt ? '2px solid var(--primary)' : '2px solid rgba(255,255,255,0.05)',
                                        borderRadius: 'var(--radius-lg)',
                                        color: answers[showQuiz.questions![currentQuestionIndex].id] === opt ? 'white' : 'var(--text-secondary)',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        transition: 'all 0.2s'
                                     }}
                                  >
                                     {opt}
                                  </button>
                               ))}
                            </div>
                            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
                               <button 
                                  disabled={currentQuestionIndex === 0} 
                                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                  className="btn btn-secondary"
                               >Back</button>
                               {currentQuestionIndex === showQuiz.questions.length - 1 ? (
                                  <button 
                                     disabled={!answers[showQuiz.questions[currentQuestionIndex].id] || submittingQuiz} 
                                     onClick={handleQuizSubmit}
                                     className="btn btn-primary"
                                     style={{ minWidth: '150px' }}
                                  >
                                     {submittingQuiz ? <Loader2 className="spin" size={18} /> : 'Finish Assessment'}
                                  </button>
                               ) : (
                                  <button 
                                     disabled={!answers[showQuiz.questions[currentQuestionIndex].id]} 
                                     onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                     className="btn btn-primary"
                                     style={{ minWidth: '150px' }}
                                  >Next Question</button>
                               )}
                            </div>
                         </>
                      ) : (
                         <p>Loading questions...</p>
                      )}
                   </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {showCertModal && certificate && (
         <div className="modal-overlay" style={{ zIndex: 2000 }}>
            <div className="modal-content" style={{ maxWidth: '900px', background: '#020617', border: '1px solid var(--primary)' }}>
               <div className="modal-header">
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                     <Award color="var(--primary-light)" /> Your Professional Certificate
                  </h2>
                  <button onClick={() => setShowCertModal(false)} className="btn btn-ghost"><X /></button>
               </div>
               <div className="modal-body" style={{ padding: '4rem', textAlign: 'center' }}>
                  {/* Certificate Preview Card */}
                  <div id="cert-preview" style={{ 
                     background: '#0f172a', 
                     border: '10px solid #1e293b', 
                     padding: '3rem', 
                     borderRadius: '4px',
                     position: 'relative',
                     marginBottom: '4rem',
                     boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                  }}>
                     <div style={{ border: '2px solid var(--primary)', padding: '2rem' }}>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', marginBottom: '1.5rem' }}>CERTIFICATE</h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', marginBottom: '1rem' }}>OF COMPLETION</p>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>This recognizes that</p>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--primary-light)', marginBottom: '2rem' }}>{userName.toUpperCase()}</h2>
                        <p style={{ color: 'white', fontSize: '1.25rem', marginBottom: '2rem' }}>has successfully finished <strong>{course.title}</strong></p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '2rem' }}>
                           <div>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800' }}>CPD POINTS</p>
                              <p style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--success)' }}>{course.cpdPoints}</p>
                           </div>
                           <div>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800' }}>DATE ISSUED</p>
                              <p style={{ fontSize: '1.2rem', fontWeight: '800' }}>{new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        {certificate.qrCodeUrl && (
                           <img src={certificate.qrCodeUrl} alt="Verification QR" style={{ width: '80px', height: '80px', margin: '0 auto', border: '5px solid white', borderRadius: '4px' }} />
                        )}
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1.5rem', fontFamily: 'monospace' }}>ID: {certificate.certificateUuid}</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
                     <button onClick={downloadPDF} className="btn btn-primary btn-lg" style={{ gap: '0.75rem', flex: 1 }}>
                        <Download size={20} /> Download PDF
                     </button>
                     <button 
                        onClick={() => {
                           const link = `${window.location.origin}/verify/${certificate.certificateUuid}`;
                           navigator.clipboard.writeText(link);
                           setCopiedLink(true);
                           setTimeout(() => setCopiedLink(false), 2000);
                        }} 
                        className="btn btn-secondary btn-lg" 
                        style={{ gap: '0.75rem', flex: 1 }}
                     >
                        {copiedLink ? <><CheckCircle size={20} /> Link Copied</> : <><Clipboard size={20} /> Copy Verification Link</>}
                     </button>
                  </div>
               </div>
            </div>
         </div>
      )}
      {showUnenrollConfirm && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center', animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="modal-header" style={{ justifyContent: 'center', border: 'none' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Confirm Un-enrollment?</h3>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <AlertCircle size={40} color="var(--error)" />
               </div>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                 Are you sure you want to un-enroll? <br/>
                 <strong style={{ color: 'var(--error)', display: 'block', marginTop: '0.5rem' }}>WARNING: All progress earned will be permanently deleted.</strong>
               </p>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={handleUnenroll}
                    disabled={unenrolling} 
                    className="btn btn-primary" 
                    style={{ flex: 1, background: 'var(--error)' }}
                  >
                    {unenrolling ? <Loader2 className="spin" size={18} /> : 'Yes, Delete Everything'}
                  </button>
                  <button onClick={() => setShowUnenrollConfirm(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
               </div>
            </div>
          </div>
        </div>
      )}

      {showGatingModal && (
        <div className="modal-overlay" style={{ zIndex: 1300 }}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center', animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
             <div className="modal-header" style={{ justifyContent: 'center', border: 'none' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '900' }}>Sequence Locked</h3>
             </div>
             <div className="modal-body" style={{ padding: '2rem' }}>
                <div style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                   <Lock size={42} color="var(--primary)" />
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
                   {gatingMessage}
                </p>
                <button onClick={() => setShowGatingModal(false)} className="btn btn-primary btn-lg" style={{ width: '100%' }}>I Understand</button>
             </div>
          </div>
        </div>
      )}

      {showNextPrompt && nextModule && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content" style={{ maxWidth: '450px', textAlign: 'center', animation: 'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <div className="modal-header" style={{ justifyContent: 'center', border: 'none' }}>
               <h3 style={{ fontSize: '1.25rem', fontWeight: '900' }}>Outstanding Progress!</h3>
            </div>
            <div className="modal-body" style={{ padding: '2rem' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                  <SkipForward size={40} color="var(--success)" />
               </div>
               <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                 You have successfully finished this module. Would you like to proceed to: <br/> 
                 <strong style={{ color: 'white', display: 'block', marginTop: '0.5rem', fontSize: '1.1rem' }}>{nextModule.title}</strong>
               </p>
               <div style={{ display: 'flex', gap: '1rem' }}>
                  <button 
                    onClick={() => {
                        setActiveModule(nextModule);
                        setShowNextPrompt(false);
                    }} 
                    className="btn btn-primary btn-lg" 
                    style={{ flex: 1 }}
                  >Yes, Next Module</button>
                  <button onClick={() => setShowNextPrompt(false)} className="btn btn-secondary btn-lg" style={{ flex: 1 }}>No, Stay Here</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
