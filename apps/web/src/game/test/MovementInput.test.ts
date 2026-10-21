import { describe, expect, it } from 'vitest';
import { movementFromKeys, normalizedMovement } from '../systems/MovementInput.js';

describe('movement input', () => {
  it('maps WASD and arrow state to one direction', () => {
    expect(movementFromKeys({ up: false, down: false, left: true, right: false })).toEqual({ x: -1, y: 0 });
    expect(movementFromKeys({ up: true, down: false, left: false, right: false })).toEqual({ x: 0, y: -1 });
  });
  it('normalizes diagonal movement to the same speed as cardinal movement', () => {
    const vector = normalizedMovement({ x: 1, y: 1 });
    expect(Math.hypot(vector.x, vector.y)).toBeCloseTo(1);
    expect(vector.x).toBeCloseTo(Math.SQRT1_2);
  });
  it('returns zero movement when no key is held or opposite keys cancel', () => {
    expect(normalizedMovement(movementFromKeys({ up: false, down: false, left: false, right: false }))).toEqual({ x: 0, y: 0 });
    expect(movementFromKeys({ up: true, down: true, left: true, right: true })).toEqual({ x: 0, y: 0 });
  });
});
