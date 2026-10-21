import { describe, expect, it } from 'vitest';
import { chooseFinalBoss } from '../content/bosses.js';
import { createRunState } from '../state/createRunState.js';
import { BossDirector } from '../systems/BossDirector.js';
import { applyKarma, getKarmaTier } from '../systems/KarmaSystem.js';

describe('karma routes and boss director', () => {
  it('classifies the exact karma boundaries and clamps changes', () => {
    expect(getKarmaTier(-100)).toBe('evil');
    expect(getKarmaTier(-50)).toBe('evil');
    expect(getKarmaTier(-49)).toBe('neutral');
    expect(getKarmaTier(49)).toBe('neutral');
    expect(getKarmaTier(50)).toBe('good');
    expect(getKarmaTier(100)).toBe('good');
    expect(applyKarma(98, 12)).toBe(100);
    expect(applyKarma(-98, -12)).toBe(-100);
    expect(() => getKarmaTier(101)).toThrow(RangeError);
  });

  it('routes evil karma to the king and good or neutral karma to the princess demon', () => {
    expect(chooseFinalBoss('evil')).toBe('king-guard');
    expect(chooseFinalBoss('neutral')).toBe('princess-demon');
    expect(chooseFinalBoss('good')).toBe('princess-demon');
  });

  it('pauses for one active boss, tracks defeat once, and rejects unknown content safely', () => {
    const run = createRunState();
    const director = new BossDirector();
    expect(director.startBoss('unknown-boss', run)).toBeNull();
    expect(run.pausedBy).toBe('none');
    expect(director.startBoss('castle-warlord', run)?.maxHp).toBeGreaterThan(0);
    expect(run.pausedBy).toBe('boss');
    director.syncBoss(123, 250);
    expect(director.activeBoss).toMatchObject({ hp: 123, phase: 'combat', attackCooldownMs: 250, alive: true });
    expect(director.startBoss('lava-behemoth', run)).toBeNull();
    expect(director.defeatBoss('lava-behemoth', run)).toBe(false);
    expect(director.defeatBoss('castle-warlord', run)).toBe(true);
    expect(run.defeatedBossIds).toEqual(['castle-warlord']);
    expect(run.pausedBy).toBe('none');
    expect(director.defeatBoss('castle-warlord', run)).toBe(false);
  });
});
