/** Pure helpers for canvas navigation (zoom / pan), kept separate so they are unit-testable. */

export const MIN_ZOOM = 0.05;
export const MAX_ZOOM = 20;
/** Step used by buttons and keyboard shortcuts (was 1.1, which felt sluggish). */
export const ZOOM_STEP = 1.25;

export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

interface WheelLike { deltaY: number; deltaMode: number; ctrlKey: boolean; metaKey?: boolean }

/**
 * Multiplicative zoom factor for a wheel event.
 * - Normalises line/page deltas (Firefox, some mice) to pixels so every browser zooms alike.
 * - Trackpad pinch arrives as ctrl+wheel with tiny deltas, so it gets a higher sensitivity
 *   (a ctrl+mouse-wheel notch keeps the normal rate).
 * - Clamps a single event so a fast fling can't jump the board across the whole zoom range.
 */
export function wheelZoomFactor(e: WheelLike): number {
  let delta = e.deltaY;
  if (e.deltaMode === 1) delta *= 33;       // DOM_DELTA_LINE
  else if (e.deltaMode === 2) delta *= 400; // DOM_DELTA_PAGE
  delta = Math.max(-150, Math.min(150, delta));
  // Trackpad pinch = ctrl+wheel with small deltas; a mouse wheel notch (|delta| >= 50) keeps the normal rate.
  const pinch = (e.ctrlKey || !!e.metaKey) && Math.abs(delta) < 50;
  return (pinch ? 0.99 : 0.9985) ** delta;
}

/**
 * Viewport transform that centres `bounds` in a w×h viewport with padding.
 * Zoom is capped to [MIN_ZOOM, maxZoom] so tiny content isn't blown up absurdly.
 */
export function computeFitTransform(
  bounds: { left: number; top: number; width: number; height: number },
  viewW: number,
  viewH: number,
  padding = 64,
  maxZoom = 1.5,
): { zoom: number; transform: [number, number, number, number, number, number] } {
  // The board-bounds helper falls back to the whole viewport on an empty board: keep 100% there.
  if (bounds.left === 0 && bounds.top === 0 && bounds.width === viewW && bounds.height === viewH) {
    return { zoom: 1, transform: [1, 0, 0, 1, 0, 0] };
  }
  const availW = Math.max(1, viewW - padding * 2);
  const availH = Math.max(1, viewH - padding * 2);
  const zoom = Math.min(maxZoom, clampZoom(Math.min(availW / Math.max(1, bounds.width), availH / Math.max(1, bounds.height))));
  const cx = bounds.left + bounds.width / 2;
  const cy = bounds.top + bounds.height / 2;
  return { zoom, transform: [zoom, 0, 0, zoom, viewW / 2 - cx * zoom, viewH / 2 - cy * zoom] };
}

/**
 * Whether `el` (or an ancestor up to `root`) can still scroll in the wheel direction.
 * Lets a widget keep native scrolling for its content, and hands the wheel to the canvas
 * zoom once the content has reached its end (or isn't scrollable at all).
 */
export function canScrollInDirection(el: Element | null, root: Element, deltaY: number, deltaX = 0): boolean {
  for (let node: Element | null = el; node && root.contains(node); node = node.parentElement) {
    const s = getComputedStyle(node);
    const h = node.scrollHeight > node.clientHeight + 1 && /(auto|scroll)/.test(s.overflowY);
    const w = node.scrollWidth > node.clientWidth + 1 && /(auto|scroll)/.test(s.overflowX);
    if (h && ((deltaY < 0 && node.scrollTop > 0) || (deltaY > 0 && node.scrollTop + node.clientHeight < node.scrollHeight - 1))) return true;
    if (w && ((deltaX < 0 && node.scrollLeft > 0) || (deltaX > 0 && node.scrollLeft + node.clientWidth < node.scrollWidth - 1))) return true;
    if (node === root) break;
  }
  return false;
}
