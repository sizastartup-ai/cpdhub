'use client';

import React, { useEffect, useRef, useState } from 'react';
import { 
  Loader2, Maximize2, ChevronLeft, ChevronRight, 
  Settings, Info, RotateCcw 
} from 'lucide-react';

interface ScormPlayerProps {
  lessonId: string;
  courseId: string;
  sourceUrl: string;
  onComplete: () => void;
}

export default function ScormPlayer({ lessonId, courseId, sourceUrl, onComplete }: ScormPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // 1. Define SCORM 1.2 API
    const API = {
      LMSInitialize: (params: string) => {
        console.log('SCORM: LMSInitialize', params);
        return 'true';
      },
      LMSFinish: (params: string) => {
        console.log('SCORM: LMSFinish', params);
        return 'true';
      },
      LMSGetValue: (key: string) => {
        console.log('SCORM: LMSGetValue', key);
        if (key === 'cmi.core.student_name') return 'Premium Learner';
        if (key === 'cmi.core.lesson_status') return 'not attempted';
        return '';
      },
      LMSSetValue: (key: string, value: string) => {
        console.log('SCORM: LMSSetValue', key, value);
        if (key === 'cmi.core.lesson_status' || key === 'cmi.completion_status') {
          if (value === 'completed' || value === 'passed') {
            onComplete();
          }
        }
        return 'true';
      },
      LMSCommit: (params: string) => {
        console.log('SCORM: LMSCommit');
        return 'true';
      },
      LMSGetLastError: () => '0',
      LMSGetErrorString: () => 'No Error',
      LMSGetDiagnostic: () => 'No Error Diagnostic',
    };

    const API_1484_11 = {
      Initialize: (p: string) => API.LMSInitialize(p),
      Terminate: (p: string) => API.LMSFinish(p),
      GetValue: (k: string) => API.LMSGetValue(k),
      SetValue: (k: string, v: string) => API.LMSSetValue(k, v),
      Commit: (p: string) => API.LMSCommit(p),
      GetLastError: () => API.LMSGetLastError(),
      GetErrorString: () => API.LMSGetErrorString(),
      GetDiagnostic: () => API.LMSGetDiagnostic(),
    };

    (window as any).API = API;
    (window as any).API_1484_11 = API_1484_11;

    return () => {
      delete (window as any).API;
      delete (window as any).API_1484_11;
    };
  }, [onComplete]);

  const handleIframeLoad = () => {
    setIsLoaded(true);
    
    // Attempt to inject CSS to hide internal TOC/Menu in Articulate/Captivate
    try {
      const doc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
      if (doc) {
        const style = doc.createElement('style');
        style.innerHTML = `
          /* Articulate Storyline & Rise */
          .menu-wrapper, .toc-wrapper, .left-column, .sidebar-container, 
          #side-panel, #left-pane, .menu-container, .nav-container,
          .articulate-menu, .navigation-sidebar { 
            display: none !important; 
          }
          
          /* iSpring & others */
          .ispring-menu, .player-toc { display: none !important; }
          
          /* Adobe Captivate */
          #toc, .toc-active { display: none !important; }

          /* Layout adjustment if possible */
          .content-wrapper, .main-column, #main-window, #canvas-container {
            width: 100% !important;
            left: 0 !important;
            margin-left: 0 !important;
          }
          
          /* Hide internal player bars if we provide our own */
          .bottom-bar, .player-bottom-bar, #control-strip {
             /* display: none !important; */ /* Uncomment if we want total control */
          }
        `;
        doc.head.appendChild(style);
      }
    } catch (e) {
      console.warn('Could not inject CSS into SCORM iframe due to cross-origin or other restriction.', e);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.getElementById('scorm-player-root')?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div id="scorm-player-root" className="scorm-container" style={{ 
      display: 'flex', 
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--surface-border)',
      boxShadow: 'var(--shadow-lg)',
      height: '100%',
      minHeight: '600px'
    }}>
      {/* Premium Header/Title Bar */}
      <div style={{ 
        padding: '1rem 2rem', 
        background: 'rgba(15, 23, 42, 0.8)', 
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            width: '12px', height: '12px', borderRadius: '50%', background: '#10b981',
            boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)',
            animation: 'pulse 2s infinite' 
          }} />
          <span style={{ fontSize: '0.75rem', fontWeight: '900', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Interactive Training <span style={{ color: 'var(--primary-light)', marginLeft: '0.5rem' }}>&middot; Module {lessonId.substring(0, 4)}</span>
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
           <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} title="Module Information"><Info size={18} /></button>
           <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }} title="Reset Progress" onClick={() => window.location.reload()}><RotateCcw size={18} /></button>
           <div style={{ width: '1px', background: 'var(--surface-border)', margin: '0 0.5rem' }} />
           <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary-light)' }} onClick={toggleFullscreen} title="Theater Mode"><Maximize2 size={18} /></button>
        </div>
      </div>

      {/* Viewport Area */}
      <div style={{ flex: 1, position: 'relative', background: '#000', overflow: 'hidden' }}>
        {!isLoaded && !error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, background: 'var(--bg-primary)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ position: 'relative', display: 'inline-block', marginBottom: '2rem' }}>
                <Loader2 size={64} className="spin" style={{ color: 'var(--primary)' }} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo-icon.png" alt="" style={{ width: '24px', opacity: 0.5 }} />
                </div>
              </div>
              <p style={{ color: 'white', fontWeight: '800', fontSize: '1.1rem', letterSpacing: '0.05em' }}>PREPARING STAGE</p>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', marginTop: '0.5rem' }}>Connecting to Learning Management System...</p>
            </div>
          </div>
        )}
        
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: '2rem', textAlign: 'center', background: 'var(--bg-primary)' }}>
            <div className="glass-card" style={{ maxWidth: '450px', border: '1px solid var(--error)' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                <Info size={32} color="var(--error)" />
              </div>
              <p style={{ color: 'white', fontWeight: '800', fontSize: '1.25rem', marginBottom: '1rem' }}>Initialization Failed</p>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>The learning module could not be initialized. This may be due to a corrupted package or session timeout.</p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: '2rem' }} onClick={() => window.location.reload()}>Retry Sequence</button>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={sourceUrl}
          style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          onLoad={handleIframeLoad}
          onError={() => setError('Module entry point (imsmanifest.xml -> href) is unreachable.')}
          sandbox="allow-scripts allow-same-origin allow-forms allow-top-navigation-by-user-activation allow-popups"
          allowFullScreen
        />
      </div>

      {/* Premium Controls Footer */}
      <div style={{ 
        padding: '1.5rem 2.5rem', 
        background: 'var(--bg-secondary)', 
        borderTop: '1px solid var(--surface-border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.3)'
      }}>
        <button 
          className="btn btn-secondary"
          style={{ border: '1px solid var(--surface-border)', paddingRight: '2rem' }}
          onClick={() => {
            try {
              const win = iframeRef.current?.contentWindow as any;
              if (win.CPAPI) win.CPAPI.sendEvent('CPAPI_GOTO_PREVIOUS_SLIDE');
              const doc = win.document;
              (doc.querySelector('.prev-button, #prev, #previous, [aria-label="Previous"]') as HTMLElement)?.click();
            } catch (e) {}
          }}
        >
          <ChevronLeft size={20} /> Back
        </button>

        <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div style={{ textAlign: 'right', display: 'none', md: 'block' } as any}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '0.1em' }}>MODULE PROGRESS</p>
            <p style={{ fontSize: '1rem', color: 'white', fontWeight: '900' }}>{isLoaded ? '45%' : '0%'}</p>
          </div>
          <div style={{ height: '8px', width: '200px', background: 'var(--bg-tertiary)', borderRadius: '99px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ height: '100%', width: isLoaded ? '45%' : '0%', background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)', transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 0 10px var(--primary)' }} />
          </div>
        </div>

        <button 
          className="btn btn-primary"
          style={{ 
            paddingLeft: '2.5rem', 
            paddingRight: '2.5rem', 
            background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
            boxShadow: '0 10px 20px rgba(59, 130, 246, 0.3)'
          }}
          onClick={() => {
            try {
              const win = iframeRef.current?.contentWindow as any;
              if (win.CPAPI) win.CPAPI.sendEvent('CPAPI_GOTO_NEXT_SLIDE');
              const doc = win.document;
              (doc.querySelector('.next-button, #next, [aria-label="Next"]') as HTMLElement)?.click();
            } catch (e) {}
          }}
        >
          Next Slide <ChevronRight size={20} />
        </button>
      </div>

    </div>
  );
}
