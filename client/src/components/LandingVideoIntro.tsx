import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  ArrowRight,
  Wind,
  ShieldCheck,
  X,
  Sparkles
} from 'lucide-react';

interface LandingVideoIntroProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LandingVideoIntro: React.FC<LandingVideoIntroProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(22);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Reset or initialize state when opened
  useEffect(() => {
    if (isOpen) {
      setStatus('ready');
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handlePlay = () => {
    setStatus('playing');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.muted = isMuted;
        videoRef.current.play().then(() => {
          setIsPlaying(true);
        }).catch((err) => {
          console.warn('Autoplay with audio blocked, falling back to muted playback:', err);
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play();
            setIsPlaying(true);
          }
        });
      }
    }, 50);
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    videoRef.current.muted = nextMuted;
    setIsMuted(nextMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setStatus('ended');
  };

  const handleSkipToEnd = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    setIsPlaying(false);
    setStatus('ended');
  };

  const handleReplay = () => {
    setStatus('playing');
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
      }
    }, 50);
  };

  const handleDismiss = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
    sessionStorage.setItem('saans_intro_seen', 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SAANS Winter Smog Intro Experience"
      className="fixed inset-0 z-50 overflow-y-auto bg-[#06090b]/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 transition-all animate-in fade-in duration-300"
    >
      {/* Background ambient smog aura */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-teal-500/10 blur-[120px] animate-pulse" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-emerald-500/10 blur-[120px] animate-pulse" />
      </div>

      <div className="relative z-10 w-full max-w-4xl bg-[#0f171c]/90 border border-slate-800 rounded-3xl p-5 sm:p-8 shadow-2xl shadow-black/80 flex flex-col items-center">
        
        {/* Top bar with quick exit */}
        <div className="w-full flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400">
              <Wind className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
              SAANS &bull; Winter Smog Story
            </span>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-400"
            aria-label="Close intro experience"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. INITIAL CLICK-TO-BEGIN SCREEN */}
        {status === 'ready' && (
          <div className="w-full flex flex-col items-center text-center space-y-6 py-6 sm:py-10 animate-in zoom-in-95 duration-200">
            {/* Glowing Brand Icon */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-400 to-green-500 p-0.5 shadow-2xl shadow-teal-500/30 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b1013] rounded-[14px] flex items-center justify-center">
                  <Wind className="w-10 h-10 text-teal-400 stroke-[2.5]" />
                </div>
              </div>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
              </span>
            </div>

            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-[11px] font-semibold">
                <Sparkles className="w-3 h-3 text-teal-400" />
                <span>Zero-Visibility Winter Smog Episode</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight">
                Because Every <span className="bg-gradient-to-r from-teal-400 via-emerald-400 to-green-400 bg-clip-text text-transparent">Breath Matters</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                When toxic winter smog blinds our roads and invades our homes, ordinary moments turn into emergencies. 
                Experience the opening narrative before stepping into the community clean-air network.
              </p>
            </div>

            {/* Click to Begin Button */}
            <div className="pt-2 flex flex-col items-center gap-3">
              <button
                onClick={handlePlay}
                className="group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 text-slate-950 font-black text-base sm:text-lg flex items-center gap-3 shadow-[0_0_35px_rgba(20,184,166,0.35)] hover:shadow-[0_0_55px_rgba(20,184,166,0.55)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-400"
                aria-label="Click to begin intro video experience"
              >
                <span className="w-10 h-10 rounded-full bg-slate-950/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-slate-950 text-slate-950 ml-0.5" />
                </span>
                <span>Click to Begin</span>
              </button>

              <button
                onClick={handleDismiss}
                className="text-xs text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1.5 pt-2 focus:outline-none focus:underline"
              >
                <span>Skip straight to SAANS platform</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. PLAYING VIDEO STATE */}
        {status === 'playing' && (
          <div className="w-full flex flex-col items-center space-y-4 animate-in fade-in duration-300">
            {/* Video container */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
              <video
                ref={videoRef}
                src="/videos/intro.mp4"
                playsInline
                onEnded={handleVideoEnded}
                onTimeUpdate={handleTimeUpdate}
                className="w-full h-full object-cover"
              />

              {/* Quick overlay controls */}
              <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
                <button
                  onClick={toggleMute}
                  className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                  aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
                  <span>{isMuted ? "Unmute" : "Sound On"}</span>
                </button>

                <button
                  onClick={handleSkipToEnd}
                  className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs font-medium flex items-center gap-1.5 transition-all"
                  aria-label="Skip to theme presentation"
                >
                  <span>Skip to End</span>
                  <FastForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bottom playback progress bar */}
              <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center gap-3 z-20">
                <button
                  onClick={togglePlayPause}
                  className="text-white hover:text-teal-400 transition-colors p-1"
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>

                <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 transition-all duration-100"
                    style={{ width: `${(currentTime / (duration || 22)) * 100}%` }}
                  />
                </div>

                <span className="text-[11px] font-mono text-slate-300">
                  {Math.floor(currentTime)}s / {Math.floor(duration || 22)}s
                </span>
              </div>
            </div>

            <div className="w-full flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Highway Smog Episode &bull; Zero-Visibility Hazard</span>
              <button
                onClick={handleDismiss}
                className="hover:text-teal-400 transition-colors flex items-center gap-1"
              >
                <span>Exit Video</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* 3. POST-VIDEO / ENDED STATE: THEME + SAANS LOGO + CONTINUE BUTTON */}
        {status === 'ended' && (
          <div className="w-full flex flex-col items-center text-center space-y-6 py-4 sm:py-6 animate-in zoom-in-95 duration-300">
            
            {/* SAANS Logo with Breathing Aura */}
            <div className="flex flex-col items-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-2xl shadow-teal-500/40 flex items-center justify-center">
                <div className="w-full h-full bg-[#0b1013] rounded-[14px] flex items-center justify-center">
                  <Wind className="w-8 h-8 text-teal-400 stroke-[2.5]" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight">
                SAANS <span className="text-teal-400">&bull;</span> सांस
              </h3>
              <p className="text-xs uppercase tracking-widest text-teal-300 font-bold">
                Because Every Breath Matters
              </p>
            </div>

            {/* Theme Explanation Statement */}
            <div className="max-w-2xl bg-slate-900/80 border border-slate-800 rounded-2xl p-5 text-left text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed shadow-inner">
              <div className="flex items-center gap-2 text-teal-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Our Theme & Mission</span>
              </div>
              <p>
                Severe winter smog doesn’t just cause catastrophic low-visibility highway collisions — it silently penetrates 
                millions of homes, choking newborn infants, elderly citizens, and daily wage workers who lack air purification.
              </p>
              <p>
                <strong className="text-white">SAANS</strong> transforms passive despair into proactive community resilience. 
                We connect vulnerable citizens with community-shared purifiers, open-source DIY Corsi-Rosenthal filtration labs, 
                verified public clean-air sanctuaries, and localized volunteer aid.
              </p>
            </div>

            {/* Action Buttons: Continue to Interface & Replay */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
              <button
                onClick={handleDismiss}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-teal-500 via-emerald-500 to-green-400 text-slate-950 font-black text-sm sm:text-base shadow-xl shadow-teal-500/25 hover:shadow-teal-500/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2.5 cursor-pointer focus:outline-none focus:ring-4 focus:ring-teal-400"
                aria-label="Continue to SAANS interface"
              >
                <span>Continue to SAANS Interface</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>

              <button
                onClick={handleReplay}
                className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                aria-label="Replay intro video"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay Video</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
