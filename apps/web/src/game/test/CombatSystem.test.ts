import { describe, expect, it } from 'vitest';
import { chooseTarget, resolveHit, type Damageable } from '../systems/CombatSystem.js';

describe('combat targeting and damage', () => {
  it('chooses the nearest target for normal enemies', () => {
    expect(chooseTarget({ x: 4, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 'nearest')).toBe('hero');
    expect(chooseTarget({ x: 9, y: 0 }, { x: 0, y: 0 }, { x: 10, y: 0 }, 'nearest')).toBe('caravan');
  });
  it('always prioritizes the caravan for wagon-rushers', () => {
    expect(chooseTarget({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 500, y: 0 }, 'caravan-priority')).toBe('caravan');
  });
  it('clamps health, marks death once, and ignores invalid or duplicate damage', () => {
    const target: Damageable = { id: 'ghoul', hp: 12, maxHp: 20 };
    expect(resolveHit(target, 5, 'sword')?.target.hp).toBe(7);
    const lethal = resolveHit(target, 50, 'sword');
    expect(lethal).toMatchObject({ damage: 7, killed: true });
    expect(target.hp).toBe(0);
    expect(resolveHit(target, 10, 'sword')).toBeNull();
    expect(resolveHit({ id: 'bad', hp: 8, maxHp: 8 }, Number.NaN, 'sword')).toBeNull();
  });
});
