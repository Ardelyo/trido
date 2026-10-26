import { describe, it, expect } from 'vitest';
import { wheelZoomFactor, computeFitTransform, clampZoom, canScrollInDirection, MIN_ZOOM, MAX_ZOOM, ZOOM_STEP } from '../utils/canvasView';

const wheel = (deltaY: number, o: Partial<{ deltaMode: number; ctrlKey: boolean }> = {}) =>
  ({ deltaY, deltaMode: 0, ctrlKey: false, ...o });

describe('wheelZoomFactor', () => {
  it('zooms in on scroll up and out on scroll down', () => {
    expect(wheelZoomFactor(wheel(-100))).toBeGreaterThan(1);
    expect(wheelZoomFactor(wheel(100))).toBeLessThan(1);
  });
  it('treats line-mode deltas (Firefox) like pixel deltas', () => {
    expect(wheelZoomFactor(wheel(3, { deltaMode: 1 }))).toBeCloseTo(wheelZoomFactor(wheel(99)), 5);
  });
  it('is more sensitive for trackpad pinch (ctrl+wheel) with the same delta', () => {
    expect(wheelZoomFactor(wheel(-5, { ctrlKey: true }))).toBeGreaterThan(wheelZoomFactor(wheel(-5)));
  });
  it('caps a single fling so it cannot jump the whole zoom range', () => {
    expect(wheelZoomFactor(wheel(100000))).toBeGreaterThan(0.75);
  });
});

describe('zoom helpers', () => {
  it('clamps to the allowed range', () => {
    expect(clampZoom(0)).toBe(MIN_ZOOM);
    expect(clampZoom(1e6)).toBe(MAX_ZOOM);
    expect(ZOOM_STEP).toBeGreaterThan(1.1);
  });
});

describe('computeFitTransform', () => {
  it('centres content and scales it to fit with padding', () => {
    const { zoom, transform } = computeFitTransform({ left: 0, top: 0, width: 2000, height: 1000 }, 1000, 800, 0);
    expect(zoom).toBeCloseTo(0.5);
    // content centre (1000,500) must land on viewport centre (500,400)
    expect(1000 * zoom + transform[4]).toBeCloseTo(500);
    expect(500 * zoom + transform[5]).toBeCloseTo(400);
  });
  it('does not blow up tiny content beyond maxZoom', () => {
    expect(computeFitTransform({ left: 10, top: 10, width: 20, height: 20 }, 1000, 800).zoom).toBe(1.5);
  });
  it('keeps 100% for the empty-board fallback bounds', () => {
    const r = computeFitTransform({ left: 0, top: 0, width: 1000, height: 800 }, 1000, 800);
    expect(r.zoom).toBe(1);
    expect(r.transform).toEqual([1, 0, 0, 1, 0, 0]);
  });
});

describe('canScrollInDirection', () => {
  const makeScroller = (scrollTop: number) => {
    const root = document.createElement('div');
    const inner = document.createElement('div');
    inner.style.overflowY = 'auto';
    root.appendChild(inner);
    document.body.appendChild(root);
    Object.defineProperty(inner, 'scrollHeight', { value: 500, configurable: true });
    Object.defineProperty(inner, 'clientHeight', { value: 200, configurable: true });
    inner.scrollTop = scrollTop;
    Object.defineProperty(inner, 'scrollTop', { value: scrollTop, writable: true, configurable: true });
    return { root, inner };
  };
  it('lets the widget scroll while content remains in that direction', () => {
    const { root, inner } = makeScroller(0);
    expect(canScrollInDirection(inner, root, 100)).toBe(true);   // can go down
    expect(canScrollInDirection(inner, root, -100)).toBe(false); // already at top → zoom instead
  });
  it('hands over to canvas zoom at the bottom', () => {
    const { root, inner } = makeScroller(300);
    expect(canScrollInDirection(inner, root, 100)).toBe(false);
  });
  it('is false for non-scrollable content', () => {
    const root = document.createElement('div');
    const inner = document.createElement('div');
    root.appendChild(inner);
    expect(canScrollInDirection(inner, root, 100)).toBe(false);
  });
});
