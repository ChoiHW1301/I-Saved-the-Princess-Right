import { describe, expect, it } from 'vitest';
import { getMultiSwordStrikeCount, getSwordWaveHitProfile, getVanguardHeatDamage, getVanguardMaxHp, getWarriorSwordRange, getWhirlwindDamageRatio, getWhirlwindIntervalMs } from '../systems/WarriorEvolutionCombat.js';
import { createRunState } from '../state/createRunState.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { resolveHit, type WeaponAttackTarget } from '../systems/CombatSystem.js';
import type { Enemy } from '../entities/Enemy.js';

function dummyTarget(id: string, x: number, y: number, hp = 100): WeaponAttackTarget {
  const target: WeaponAttackTarget = { id, hp, maxHp: hp, dead: false, worldPosition: { x, y }, hitRadius: 12,
    applyWeaponHit(amount, sourceId) { return resolveHit(target, amount, sourceId); } };
  return target;
}

describe('warrior evolution combat values', () => {
  it('uses the full sword range for the whirlwind sweep', () => {
    expect(getWarriorSwordRange(125, 0)).toBe(125);
    expect(getWarriorSwordRange(125, 18)).toBe(143);
    expect(getWarriorSwordRange(125, 18 + 22 + 28 + 35)).toBe(228);
  });
  it('scales whirlwind from two rotations a second and 50 to 100 percent damage', () => {
    expect(getWhirlwindIntervalMs(0)).toBe(500);
    expect(getWhirlwindIntervalMs(0.5)).toBeCloseTo(500 / 1.5);
    expect(getWhirlwindDamageRatio(0)).toBe(0.5);
    expect(getWhirlwindDamageRatio(5)).toBe(1);
    expect(getWhirlwindDamageRatio(8)).toBe(1);
  });
  it('grows multi-sword from two to five distinct strikes', () => {
    expect([0, 1, 2, 3, 4].map(getMultiSwordStrikeCount)).toEqual([2, 3, 4, 5, 5]);
  });
  it('loses twenty percentage points per sword-wave hit', () => {
    expect([0, 1, 2, 3, 4].map(getSwordWaveHitProfile)).toEqual([1, .8, .6, .4, .2].map((ratio) => ({ damageRatio: ratio, sizeRatio: ratio })));
  });
  it('doubles only earned HP and raises heat damage from two to twelve', () => {
    expect(getVanguardMaxHp(100, 100)).toBe(100);
    expect(getVanguardMaxHp(100, 135)).toBe(170);
    expect(getVanguardHeatDamage(0)).toBe(2);
    expect(getVanguardHeatDamage(5)).toBe(12);
    expect(getVanguardHeatDamage(9)).toBe(12);
  });
});

describe('warrior evolution weapon behavior', () => {
  const origin = { x: 100, y: 100 };
  const aim = { x: 200, y: 100 };
  it('extends whirlwind hits to the sword range after a range upgrade', () => {
    const run = createRunState('warrior');
    run.warriorEvolutionId = 'whirlwind';
    const edge = dummyTarget('edge', 225, 100);
    const beyond = dummyTarget('beyond', 243, 100);
    const weapons = new WeaponSystem();
    weapons.update(run, origin, [], 16, () => 0.9, undefined, aim, undefined, undefined, [edge, beyond]);
    expect(edge.hp).toBe(94);
    expect(beyond.hp).toBe(100);

    run.upgradeStats['sword-range'] = 18;
    weapons.update(run, origin, [], 500, () => 0.9, undefined, aim, undefined, undefined, [edge, beyond]);
    expect(beyond.hp).toBe(94);
  });
  it('whirlwind hits behind the warrior twice in one second at half sword damage', () => {
    const run = createRunState('warrior');
    run.warriorEvolutionId = 'whirlwind';
    const target = dummyTarget('behind', 50, 100);
    const weapons = new WeaponSystem();
    weapons.update(run, origin, [], 16, () => 0.9, undefined, aim, undefined, undefined, [target]);
    expect(target.hp).toBe(94);
    weapons.update(run, origin, [], 500, () => 0.9, undefined, aim, undefined, undefined, [target]);
    expect(target.hp).toBe(88);
  });

  it('multi-sword lands two separate hits 90ms apart', () => {
    const run = createRunState('warrior');
    run.warriorEvolutionId = 'multi-sword';
    const target = dummyTarget('front', 145, 100);
    const weapons = new WeaponSystem();
    weapons.update(run, origin, [], 16, () => 0.9, undefined, aim, undefined, undefined, [target]);
    expect(target.hp).toBe(88);
    weapons.update(run, origin, [], 90, () => 0.9, undefined, aim, undefined, undefined, [target]);
    expect(target.hp).toBe(76);
  });

  it('sword wave damages a new target after passing through the first', () => {
    const run = createRunState('warrior');
    run.warriorEvolutionId = 'sword-wave';
    run.upgradeStats['sword-wave-penetration'] = 1;
    const near = dummyTarget('near', 240, 100);
    const far = dummyTarget('far', 350, 100);
    const weapons = new WeaponSystem();
    const targets = [near, far];
    weapons.update(run, origin, [] as Enemy[], 16, () => 0.9, undefined, aim, undefined, undefined, targets);
    weapons.update(run, origin, [] as Enemy[], 500, () => 0.9, undefined, aim, undefined, undefined, targets);
    expect(near.hp).toBe(88);
    expect(far.hp).toBeCloseTo(90.4);
  });
});
