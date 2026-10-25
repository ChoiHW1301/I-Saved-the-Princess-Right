import { describe, expect, it } from 'vitest';
import { seededRandom } from '../systems/seededRandom.js';
import { mapSnapshotWorldPoint } from '../systems/SaveSnapshotSystem.js';

describe('CaravanScene world setup helpers', () => {
  it('produces repeatable seeded world randomness', () => {
    const first = seededRandom(2026);
    const second = seededRandom(2026);
    expect(Array.from({ length: 4 }, first)).toEqual(Array.from({ length: 4 }, second));
  });

  it('maps legacy and current saved positions into the centered 4:3 world', () => {
    const target = { width: 960, height: 720, roadCenterY: 360 };
    expect(mapSnapshotWorldPoint({ x: 800, y: 267 }, { worldWidth: 1280, roadCenterY: 267 }, target))
      .toEqual({ x: 600, y: 360 });
    expect(mapSnapshotWorldPoint({ x: 400, y: 420 }, { worldWidth: 960, roadCenterY: 360 }, target))
      .toEqual({ x: 400, y: 420 });
    expect(mapSnapshotWorldPoint({ x: 1600, y: 800 }, { worldWidth: 1280, roadCenterY: 267 }, target))
      .toEqual({ x: 960, y: 720 });
  });
});
