'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Settings, Type, Layout, SkipForward, Loader2 
} from 'lucide-react';

interface Props {
  url: string;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onEnded: () => void;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
    Vimeo: any;
  }
}

export default function ModularVideoPlayer({ url, onTimeUpdate, onEnded }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [theaterMode, setTheaterMode] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const typeRef = useRef<'youtube' | 'vimeo' | 'direct'>('youtube');

  useEffect(() => {
    setIsLoading(true);
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      typeRef.current = 'youtube';
      loadYouTubePlayer();
    } else if (url.includes('vimeo.com')) {
      typeRef.current = 'vimeo';
      loadVimeoPlayer();
    }
  }, [url]);

  const loadYouTubePlayer = () => {
    const videoId = url.includes('watch?v=') 
      ? url.split('v=')[1]?.split('&')[0] 
      : url.split('/').pop();

    const init = () => {
      if (playerRef.current) playerRef.current.destroy();
      playerRef.current = new window.YT.Player('player-target', {
        height: '100%',
        width: '100%',
        videoId: videoId,
        playerVars: {
          controls: 0,
          disablekb: 1,
          rel: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          showinfo: 0
        },
        events: {
          onReady: (event: any) => {
            setIsLoading(false);
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              startTracking();
            } else {
              setIsPlaying(false);
            }
            if (event.data === window.YT.PlayerState.ENDED) {
              onEnded();
            }
          }
        }
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = init;
    } else {
      init();
    }
  };

  const loadVimeoPlayer = () => {
    if (!window.Vimeo) {
      const tag = document.createElement('script');
      tag.src = "https://player.vimeo.com/api/player.js";
      document.body.appendChild(tag);
      tag.onload = initVimeo;
    } else {
      initVimeo();
    }
  };

  const initVimeo = () => {
    const videoId = url.split('/').pop();
    if (playerRef.current) playerRef.current.destroy();
    playerRef.current = new window.Vimeo.Player('player-target', {
      id: videoId,
      controls: false,
      responsive: true
    });

    playerRef.current.on('loaded', () => {
      setIsLoading(false);
      playerRef.current.getDuration().then((d: number) => setDuration(d));
    });

    playerRef.current.on('play', () => {
        setIsPlaying(true);
        startTracking();
    });
    playerRef.current.on('pause', () => setIsPlaying(false));
    playerRef.current.on('ended', () => onEnded());
  };

  const startTracking = () => {
    const interval = setInterval(() => {
      if (!playerRef.current) return clearInterval(interval);
      
      if (typeRef.current === 'youtube') {
        const time = playerRef.current.getCurrentTime();
        const d = playerRef.current.getDuration();
        setCurrentTime(time);
        setDuration(d);
        onTimeUpdate(time, d);
      } else {
        Promise.all([
           playerRef.current.getCurrentTime(),
           playerRef.current.getDuration()
        ]).then(([time, d]: [number, number]) => {
          setCurrentTime(time);
          setDuration(d);
          onTimeUpdate(time, d);
        });
      }
      
      if (!isPlaying) clearInterval(interval);
    }, 1000);
  };

  const togglePlay = () => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      try {
        typeRef.current === 'youtube' ? playerRef.current?.pauseVideo?.() : playerRef.current?.pause?.();
      } catch (e) {}
    } else {
      try {
        typeRef.current === 'youtube' ? playerRef.current?.playVideo?.() : playerRef.current?.play?.();
      } catch (e) {}
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (typeRef.current === 'youtube') {
      playerRef.current.seekTo(time);
    } else {
      playerRef.current.setCurrentTime(time);
    }
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (isMuted) {
      typeRef.current === 'youtube' ? playerRef.current.unMute() : playerRef.current.setVolume(volume);
    } else {
      typeRef.current === 'youtube' ? playerRef.current.mute() : playerRef.current.setVolume(0);
    }
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (v: number) => {
    setVolume(v);
    if (typeRef.current === 'youtube') {
      playerRef.current.setVolume(v * 100);
    } else {
      playerRef.current.setVolume(v);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  return (
    <div 
      ref={containerRef}
      className={`player-container ${theaterMode ? 'theater' : ''}`}
      style={{
        position: 'relative', width: '100%', height: '100%',
        background: '#000', overflow: 'hidden'
      }}
    >
      <div id="player-target" style={{ width: '100%', height: '100%' }} />

      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000' }}>
          <Loader2 className="spin" size={48} color="var(--primary)" />
        </div>
      )}

      {/* Overlay for clicking to toggle play */}
      <div 
        onClick={togglePlay}
        style={{ position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10 }} 
      />

      {/* Custom Controls */}
      <div className="controls-bar" style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '2rem 1.5rem 1rem',
        background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
        transition: 'opacity 0.3s',
        display: 'flex', flexDirection: 'column', gap: '1rem',
        zIndex: 20,
        opacity: isPlaying ? 0 : 1, // Auto hide (simplified)
      }} 
      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
      onMouseLeave={(e) => isPlaying && (e.currentTarget.style.opacity = '0')}
      >
        {/* Progress Bar */}
        <div style={{ position: 'relative', width: '100%', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px', cursor: 'pointer' }} onClick={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pos = (e.clientX - rect.left) / rect.width;
             seek(pos * duration);
        }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(currentTime/duration)*100}%`, background: 'var(--primary)', borderRadius: '2px' }} />
          <div style={{ position: 'absolute', left: `${(currentTime/duration)*100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: '12px', height: '12px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 10px rgba(0,0,0,0.5)' }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button onClick={togglePlay} className="control-btn" style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button onClick={toggleMute} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
                {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input 
                type="range" min="0" max="1" step="0.1" value={volume} 
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                style={{ width: '60px', height: '4px', cursor: 'pointer' }} 
              />
            </div>

            <span style={{ fontSize: '0.85rem', color: '#fff', fontWeight: '600' }}>
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
             <button className="control-btn" title="Subtitles"><Type size={20} color="#fff" /></button>
             <button className="control-btn" title="Quality"><Settings size={20} color="#fff" /></button>
             <button 
              onClick={() => setTheaterMode(!theaterMode)} 
              className="control-btn" 
              title="Theater Mode"
             ><Layout size={20} color={theaterMode ? 'var(--primary)' : '#fff'} /></button>
             <button onClick={toggleFullScreen} className="control-btn" title="Full Screen">
               {document.fullscreenElement ? <Minimize size={20} color="#fff" /> : <Maximize size={20} color="#fff" />}
             </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .control-btn { background: none; border: none; padding: 0.25rem; transition: transform 0.2s; }
        .control-btn:hover { transform: scale(1.1); }
      `}</style>
    </div>
  );
}
