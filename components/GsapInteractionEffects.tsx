import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export const GsapInteractionEffects: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fast quickTo setters for 120fps mouse smoothing
    const setDotX = gsap.quickTo(dotRef.current, 'x', { duration: 0.15, ease: 'power3' });
    const setDotY = gsap.quickTo(dotRef.current, 'y', { duration: 0.15, ease: 'power3' });

    let isVisible = false;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isVisible && dotRef.current) {
        gsap.to(dotRef.current, { opacity: 0.45, scale: 1, duration: 0.2 });
        isVisible = true;
      }
      setDotX(e.clientX);
      setDotY(e.clientY);
    };

    const handleMouseLeave = () => {
      if (dotRef.current) {
        gsap.to(dotRef.current, { opacity: 0, scale: 0.5, duration: 0.2 });
        isVisible = false;
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!containerRef.current) return;

      // Spawn subtle ripple ring
      const ripple = document.createElement('div');
      ripple.className = 'pointer-events-none fixed rounded-full border border-blue-500/50 z-[9999]';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '8px';
      ripple.style.height = '8px';
      ripple.style.transform = 'translate(-50%, -50%)';
      containerRef.current.appendChild(ripple);

      gsap.to(ripple, {
        width: 48,
        height: 48,
        opacity: 0,
        borderWidth: '0.5px',
        duration: 0.4,
        ease: 'power2.out',
        onComplete: () => {
          ripple.remove();
        },
      });

      // Quick pulse on trailing dot
      if (dotRef.current) {
        gsap.fromTo(dotRef.current, { scale: 1.8 }, { scale: 1, duration: 0.25, ease: 'back.out(2)' });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    window.addEventListener('mousedown', handleClick, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-[9998] overflow-hidden select-none">
      {/* Subtle trailing glow dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full bg-blue-600/30 backdrop-blur-xs opacity-0 scale-50 pointer-events-none will-change-transform"
      />
    </div>
  );
};
