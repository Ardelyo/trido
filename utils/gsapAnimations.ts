import gsap from 'gsap';

/**
 * Trido GSAP Animation Engine
 * Hardware-accelerated UI and Canvas animation presets.
 */

// 1. Elastic entrance for chat bubbles and cards
export const animateBubbleEntrance = (element: HTMLElement | null, delay = 0) => {
  if (!element) return;
  gsap.fromTo(
    element,
    {
      opacity: 0,
      y: 18,
      scale: 0.95,
      transformOrigin: 'bottom left',
    },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      delay,
      ease: 'back.out(1.5)',
      clearProps: 'transformOrigin',
    }
  );
};

// 2. Pulse / breathing animation for AI thinking state
export const animateThinkingPulse = (element: HTMLElement | null) => {
  if (!element) return () => {};
  const tween = gsap.to(element, {
    scale: 1.06,
    opacity: 0.85,
    repeat: -1,
    yoyo: true,
    duration: 0.7,
    ease: 'sine.inOut',
  });
  return () => tween.kill();
};

// 3. Click ripple wave on canvas or interactive buttons
export const triggerClickRipple = (x: number, y: number, container: HTMLElement | null) => {
  if (!container || typeof document === 'undefined') return;

  const ripple = document.createElement('div');
  ripple.className = 'pointer-events-none fixed rounded-full border-2 border-blue-500/60 z-[9999]';
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  ripple.style.width = '12px';
  ripple.style.height = '12px';
  ripple.style.transform = 'translate(-50%, -50%)';
  container.appendChild(ripple);

  gsap.to(ripple, {
    width: 64,
    height: 64,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    onComplete: () => {
      ripple.remove();
    },
  });
};

// 4. Smooth magnetic spring for tool buttons
export const animateMagneticHover = (element: HTMLElement | null, x: number, y: number) => {
  if (!element) return;
  gsap.to(element, {
    x: x * 0.25,
    y: y * 0.25,
    duration: 0.3,
    ease: 'power2.out',
  });
};

export const resetMagneticHover = (element: HTMLElement | null) => {
  if (!element) return;
  gsap.to(element, {
    x: 0,
    y: 0,
    duration: 0.4,
    ease: 'elastic.out(1, 0.4)',
  });
};
