/**
 * Trido motion system — single source of truth for animation tokens.
 * Follows the motion.dev conventions: spring presets for physical UI,
 * short eased tweens for opacity/colour, and shared variants for
 * enter/exit so every surface moves the same way.
 */
import type { Transition, Variants } from 'motion/react';

/** Easing curves (cubic-bezier tuples accepted by motion). */
export const ease = {
  /** Fast out, soft landing — default for enter/exit. */
  out: [0.16, 1, 0.3, 1] as const,
  /** Symmetric — for large page-level moves. */
  inOut: [0.76, 0, 0.24, 1] as const,
};

/** Durations in seconds. */
export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.4,
} as const;

/** Spring presets. */
export const spring = {
  /** Buttons, toggles, small chips — crisp and quick. */
  snappy: { type: 'spring', stiffness: 420, damping: 30 } satisfies Transition,
  /** Panels, drawers, docks — default for surfaces. */
  smooth: { type: 'spring', stiffness: 300, damping: 26 } satisfies Transition,
  /** Playful emphasis — celebratory or attention moments. */
  bouncy: { type: 'spring', stiffness: 340, damping: 18 } satisfies Transition,
  /** Cursor-follow / magnification (dock). */
  dock: { mass: 0.1, stiffness: 220, damping: 14 } satisfies Transition,
};

/** Tween presets for non-physical properties. */
export const tween = {
  fade: { duration: duration.base, ease: ease.out } satisfies Transition,
  fast: { duration: duration.fast, ease: ease.out } satisfies Transition,
  slow: { duration: duration.slow, ease: ease.out } satisfies Transition,
};

/** Shared enter/exit variants. Use with `initial="hidden" animate="show" exit="exit"`. */
export const variants = {
  fade: {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: tween.fade },
    exit: { opacity: 0, transition: tween.fast },
  },
  fadeUp: {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: spring.smooth },
    exit: { opacity: 0, y: 8, transition: tween.fast },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.94 },
    show: { opacity: 1, scale: 1, transition: spring.snappy },
    exit: { opacity: 0, scale: 0.96, transition: tween.fast },
  },
  slideUp: {
    hidden: { opacity: 0, y: 80 },
    show: { opacity: 1, y: 0, transition: spring.smooth },
    exit: { opacity: 0, y: 80, transition: spring.smooth },
  },
  slideRight: {
    hidden: { x: '100%' },
    show: { x: 0, transition: spring.smooth },
    exit: { x: '100%', transition: spring.smooth },
  },
  stagger: {
    hidden: {},
    show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
  },
} satisfies Record<string, Variants>;

/** Gesture presets for pressable elements (touch-friendly: no hover-only affordances). */
export const press = {
  whileTap: { scale: 0.94 },
  whileHover: { scale: 1.04 },
  transition: spring.snappy,
} as const;
