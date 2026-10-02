import { describe, it, expect } from 'vitest';
import {
  doBoxesOverlap,
  getQuadrantCoordinates,
  findBestEmptyZone,
  BoundingBox
} from '../services/spatialOccupancyGrid';

describe('Trido 2D Spatial Occupancy Grid & Collision Resolver', () => {
  it('correctly detects overlapping and non-overlapping bounding boxes', () => {
    const boxA: BoundingBox = { x: 100, y: 100, width: 200, height: 200 };
    const boxOverlapping: BoundingBox = { x: 250, y: 250, width: 100, height: 100 };
    const boxFarAway: BoundingBox = { x: 800, y: 800, width: 100, height: 100 };

    expect(doBoxesOverlap(boxA, boxOverlapping)).toBe(true);
    expect(doBoxesOverlap(boxA, boxFarAway)).toBe(false);
  });

  it('calculates deterministic coordinates across standard 9 quadrants', () => {
    const viewport = { width: 1440, height: 900 };
    const topLeft = getQuadrantCoordinates('TOP_LEFT', 300, 200, viewport);
    const center = getQuadrantCoordinates('CENTER', 300, 200, viewport);
    const bottomRight = getQuadrantCoordinates('BOTTOM_RIGHT', 300, 200, viewport);

    expect(topLeft.x).toBe(60);
    expect(topLeft.y).toBe(60);
    expect(center.x).toBe(Math.round((1440 - 300) / 2));
    expect(center.y).toBe(Math.round((900 - 200) / 2));
    expect(bottomRight.x).toBe(1440 - 300 - 60);
    expect(bottomRight.y).toBe(900 - 200 - 60);
  });

  it('automatically resolves to a non-colliding quadrant when requested zone is occupied', () => {
    const existingElements = {
      widget_center: {
        id: 'widget_center',
        x: 570,
        y: 350,
        width: 300,
        height: 200,
      }
    };

    // Requesting 'CENTER' which is already occupied
    const result = findBestEmptyZone('CENTER', 300, 200, existingElements, { width: 1440, height: 900 });

    expect(result).toBeDefined();
    expect(result.hasCollision).toBe(false);
    // Should route to a non-colliding neighboring quadrant (like TOP_RIGHT, TOP_LEFT, etc.)
    expect(result.quadrant).not.toBe('CENTER');
  });
});
