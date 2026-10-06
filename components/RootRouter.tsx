import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import App from '../App';
import LandingPage from './landing/LandingPage';

function isElectronEnv(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).electronAPI ||
    (window as any).process?.type === 'renderer' ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
}

function isLocalEnv(): boolean {
  if (typeof window === 'undefined') return false;
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host.endsWith('.local') ||
    window.location.port === '3000' ||
    window.location.port === '3030' ||
    window.location.port === '5173'
  );
}

/**
 * Trido Transition Overlay
 * Minimalist, solid colors, zero gradients, ultra-smooth exponential ease.
 */
const TransitionCurtain: React.FC<{ isExiting: boolean; message?: string }> = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] } }}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0a1a3a] text-white select-none pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 1.05, opacity: 0, y: -10 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-5 px-6 text-center"
      >
        {/* Exact Landing Page Logo Badge */}
        <div className="relative">
          <div className="w-16 h-16 rounded-[1.2rem] bg-white flex items-center justify-center shadow-lg border border-white/20">
            <svg viewBox="0 0 24 24" className="h-9 w-9" fill="none">
              <path
                d="M7 4.5v15l4.2-4.1 2.9 5.1 2.4-1.3-2.9-5H19L7 4.5Z"
                fill="#1550AA"
                stroke="#1550AA"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <motion.span
            className="absolute -inset-1.5 rounded-[1.5rem] border border-[#ffcc00]/50"
            animate={{ scale: [1, 1.14, 1], opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div>
          <div className="flex items-center justify-center gap-2">
            <span className="font-extrabold text-2xl tracking-tight text-white">TRIDO</span>
            <span className="text-sm font-semibold px-2 py-0.5 rounded-full bg-[#1550aa] text-white">Smartboard</span>
          </div>
          <p className="mt-2 text-sm text-white/70 font-medium">
            {message || 'Mempersiapkan Digital Classroom...'}
          </p>
        </div>

        {/* Minimal Solid Loading Bar (Strictly Zero Gradient) */}
        <div className="w-48 h-1 rounded-full bg-white/10 overflow-hidden relative mt-1">
          <motion.div
            className="absolute inset-y-0 left-0 bg-[#ffcc00] rounded-full"
            initial={{ left: "-40%", width: "40%" }}
            animate={{ left: "100%", width: "50%" }}
            transition={{ duration: 0.85, repeat: Infinity, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </motion.div>
    </motion.div>
  );
};

export const RootRouter: React.FC = () => {
  const determineInitialRoute = (): 'app' | 'landing' => {
    if (typeof window === 'undefined') return 'app';

    const params = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.toLowerCase();

    // Explicit query param overrides
    if (params.get('landing') === 'true' || params.get('preview') === 'landing') {
      return 'landing';
    }
    if (params.get('app') === 'true' || params.has('room') || pathname.startsWith('/room')) {
      return 'app';
    }

    // Direct path routing
    if (pathname === '/app' || pathname === '/board' || pathname === '/classroom') {
      return 'app';
    }

    // Localhost or Electron App Launch defaults directly to the smartboard canvas
    if (isElectronEnv() || isLocalEnv()) {
      return 'app';
    }

    // Web domain root defaults to the Landing Page
    return 'landing';
  };

  const [route, setRoute] = useState<'app' | 'landing'>(determineInitialRoute);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handlePopState = () => {
      setRoute(determineInitialRoute());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLaunchApp = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.history.pushState({ tridoView: 'app' }, '', '/app');
      } catch {
        // Fallback if pushState fails
      }
    }

    // Trigger smooth cinematic transition
    setIsTransitioning(true);

    // After curtain smoothly settles, switch component under the curtain
    setTimeout(() => {
      setRoute('app');
      // Lift curtain with exponential ease
      setTimeout(() => {
        setIsTransitioning(false);
      }, 350);
    }, 450);
  }, []);

  return (
    <div className="relative w-full min-h-screen bg-[#f8fafc]">
      <AnimatePresence mode="wait">
        {route === 'landing' ? (
          <motion.div
            key="landing-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ 
              opacity: 0, 
              scale: 0.985, 
              filter: "blur(6px)",
              transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="w-full"
          >
            <LandingPage onLaunchApp={handleLaunchApp} />
          </motion.div>
        ) : (
          <motion.div
            key="app-view"
            initial={{ opacity: 0, scale: 1.012 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } 
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.99,
              transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } 
            }}
            className="w-full h-screen overflow-hidden"
          >
            <App />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Transition Curtain */}
      <AnimatePresence>
        {isTransitioning && (
          <TransitionCurtain isExiting={false} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default RootRouter;
