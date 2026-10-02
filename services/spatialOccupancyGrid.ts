/**
 * Trido 2D Spatial Occupancy Grid & Collision Resolver
 * Calculates non-colliding placement coordinates for new widgets and diagrams on the whiteboard canvas.
 * Zero-risk, pure mathematical utility.
 */

export interface BoundingBox {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ViewportDimension {
  width: number;
  height: number;
}

export type GridQuadrant =
  | 'TOP_LEFT'
  | 'TOP_CENTER'
  | 'TOP_RIGHT'
  | 'CENTER_LEFT'
  | 'CENTER'
  | 'CENTER_RIGHT'
  | 'BOTTOM_LEFT'
  | 'BOTTOM_CENTER'
  | 'BOTTOM_RIGHT';

export interface PlacementResult {
  x: number;
  y: number;
  quadrant: GridQuadrant;
  hasCollision: boolean;
}

const DEFAULT_MARGIN = 24;

/**
 * Checks if two bounding boxes overlap, with an optional safety margin.
 */
export function doBoxesOverlap(a: BoundingBox, b: BoundingBox, margin = DEFAULT_MARGIN): boolean {
  return !(
    a.x + a.width + margin <= b.x ||
    b.x + b.width + margin <= a.x ||
    a.y + a.height + margin <= b.y ||
    b.y + b.height + margin <= a.y
  );
}

/**
 * Calculates candidate anchor coordinates for a given grid quadrant.
 */
export function getQuadrantCoordinates(
  quadrant: GridQuadrant,
  elementWidth: number,
  elementHeight: number,
  viewport: ViewportDimension = { width: 1440, height: 900 },
  padding = 60
): { x: number; y: number } {
  const maxX = Math.max(0, viewport.width - elementWidth - padding);
  const maxY = Math.max(0, viewport.height - elementHeight - padding);
  const midX = Math.round(Math.max(padding, (viewport.width - elementWidth) / 2));
  const midY = Math.round(Math.max(padding, (viewport.height - elementHeight) / 2));

  switch (quadrant) {
    case 'TOP_LEFT':
      return { x: padding, y: padding };
    case 'TOP_CENTER':
      return { x: midX, y: padding };
    case 'TOP_RIGHT':
      return { x: maxX, y: padding };
    case 'CENTER_LEFT':
      return { x: padding, y: midY };
    case 'CENTER':
      return { x: midX, y: midY };
    case 'CENTER_RIGHT':
      return { x: maxX, y: midY };
    case 'BOTTOM_LEFT':
      return { x: padding, y: maxY };
    case 'BOTTOM_CENTER':
      return { x: midX, y: maxY };
    case 'BOTTOM_RIGHT':
      return { x: maxX, y: maxY };
    default:
      return { x: midX, y: midY };
  }
}

/**
 * Resolves the optimal collision-free coordinate for a new component.
 * If the requested quadrant is occupied, it systematically searches neighboring quadrants.
 */
export function findBestEmptyZone(
  requestedQuadrant: GridQuadrant = 'CENTER',
  elementWidth = 550,
  elementHeight = 400,
  existingElements: Record<string, any> = {},
  viewport: ViewportDimension = { width: 1440, height: 900 }
): PlacementResult {
  // Extract active bounding boxes
  const occupiedBoxes: BoundingBox[] = Object.entries(existingElements)
    .filter(([_, el]) => el && typeof el.x === 'number' && typeof el.y === 'number')
    .map(([id, el]) => ({
      id,
      x: el.x,
      y: el.y,
      width: el.width || 480,
      height: el.height || 360,
    }));

  const candidateQuadrants: GridQuadrant[] = [
    requestedQuadrant,
    'CENTER',
    'TOP_RIGHT',
    'TOP_LEFT',
    'CENTER_RIGHT',
    'CENTER_LEFT',
    'BOTTOM_CENTER',
    'BOTTOM_RIGHT',
    'BOTTOM_LEFT',
  ];

  // 1. Try candidate quadrants in priority order
  for (const quad of candidateQuadrants) {
    const coords = getQuadrantCoordinates(quad, elementWidth, elementHeight, viewport);
    const candidateBox: BoundingBox = {
      x: coords.x,
      y: coords.y,
      width: elementWidth,
      height: elementHeight,
    };

    const hasCollision = occupiedBoxes.some(occ => doBoxesOverlap(candidateBox, occ));
    if (!hasCollision) {
      return {
        x: coords.x,
        y: coords.y,
        quadrant: quad,
        hasCollision: false,
      };
    }
  }

  // 2. Fallback: Spiral offset search from the requested quadrant
  const baseCoords = getQuadrantCoordinates(requestedQuadrant, elementWidth, elementHeight, viewport);
  const spiralSteps = [
    { dx: 40, dy: 40 },
    { dx: -40, dy: 40 },
    { dx: 60, dy: -60 },
    { dx: -60, dy: -60 },
    { dx: 80, dy: 80 },
  ];

  for (const step of spiralSteps) {
    const candidateX = Math.max(20, baseCoords.x + step.dx);
    const candidateY = Math.max(20, baseCoords.y + step.dy);
    const candidateBox: BoundingBox = {
      x: candidateX,
      y: candidateY,
      width: elementWidth,
      height: elementHeight,
    };

    const collisionCount = occupiedBoxes.filter(occ => doBoxesOverlap(candidateBox, occ)).length;
    if (collisionCount <= 1) {
      return {
        x: candidateX,
        y: candidateY,
        quadrant: requestedQuadrant,
        hasCollision: true,
      };
    }
  }

  // 3. Safe baseline fallback
  return {
    x: baseCoords.x,
    y: baseCoords.y,
    quadrant: requestedQuadrant,
    hasCollision: true,
  };
}
