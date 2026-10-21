import { describe, expect, it } from 'vitest';
import { seededRandom } from '../systems/seededRandom.js';

describe('CaravanScene world setup helpers', () => {
  it('produces repeatable seeded world randomness', () => {
    const first = seededRandom(2026);
    const second = seededRandom(2026);
    expect(Array.from({ length: 4 }, first)).toEqual(Array.from({ length: 4 }, second));
  });
});
