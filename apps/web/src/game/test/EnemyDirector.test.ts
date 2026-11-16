import { describe, expect, it, vi } from 'vitest';
import type { Enemy } from '../entities/Enemy.js';
import { EnemyDirector } from '../systems/EnemyDirector.js';

describe('enemy director fixed bosses', () => {
  it('leaves the lava magician stationary between its scripted teleports', () => {
    const setPosition = vi.fn();
    const mage = {
      dead: false,
      definition: { id: 'lava-magician' },
      bossMilestoneId: 'lava-5min-slot',
      x: 240,
      y: 96,
      attackCooldownMs: 0,
      setPosition,
    } as unknown as Enemy;

    const attacks = new EnemyDirector().update([mage], { x: 700, y: 400 }, { x: 640, y: 480 }, 1000);

    expect(mage).toMatchObject({ x: 240, y: 96, attackCooldownMs: 0 });
    expect(setPosition).not.toHaveBeenCalled();
    expect(attacks).toEqual([]);
  });
});
