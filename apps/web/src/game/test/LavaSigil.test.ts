import { describe, expect, it, vi } from 'vitest';
import { createRunState } from '../state/createRunState.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';
import { resolveHit } from '../systems/CombatSystem.js';
import { advanceLavaSigil, applyLavaSigilHit, isWithinLavaSigilRadius, isWithinLavaSigilRectRadius, LAVA_SIGIL_EXPLOSION_DAMAGE, LAVA_SIGIL_EXPLOSION_RADIUS, LAVA_SIGIL_FUSE_MS } from '../systems/LavaSigilSystem.js';

function makeSigilTarget(id: string, x: number) {
  return {
    id, hp: 3, maxHp: 3, dead: false, hitRadius: 22, worldPosition: { x, y: 0 },
    applyWeaponHit(amount: number, sourceId: string) { return resolveHit(this, 1, sourceId); },
  };
}

describe('lava sigil combat and fuse', () => {
  it('takes one hit point per real hit and ignores hits after destruction', () => {
    const sigil = { id: 'sigil', hp: 3, maxHp: 3, dead: false };
    expect(applyLavaSigilHit(sigil, 'bow')?.damage).toBe(1);
    expect(sigil.hp).toBe(2);
    expect(applyLavaSigilHit(sigil, 'sword')?.damage).toBe(1);
    expect(applyLavaSigilHit(sigil, 'fireball')?.killed).toBe(true);
    expect(sigil.dead).toBe(true);
    expect(applyLavaSigilHit(sigil, 'bow')).toBeNull();
  });

  it('expires once after three seconds, while destroyed sigils do not explode', () => {
    const sigil = { dead: false, remainingMs: LAVA_SIGIL_FUSE_MS };
    expect(advanceLavaSigil(sigil, 1000)).toBe('active');
    expect(sigil.remainingMs).toBe(2000);
    expect(advanceLavaSigil(sigil, 2000)).toBe('expired');
    sigil.dead = true;
    expect(advanceLavaSigil(sigil, 1)).toBe('destroyed');
    expect(LAVA_SIGIL_EXPLOSION_RADIUS).toBe(100);
    expect(LAVA_SIGIL_EXPLOSION_DAMAGE).toBe(25);
  });

  it('checks player circles and wagon rectangle against the 100-pixel explosion radius', () => {
    expect(isWithinLavaSigilRadius({ x: 0, y: 0 }, { x: 100, y: 0 })).toBe(true);
    expect(isWithinLavaSigilRadius({ x: 0, y: 0 }, { x: 100.01, y: 0 })).toBe(false);
    const wagon = { left: 100, right: 300, top: 200, bottom: 300 };
    expect(isWithinLavaSigilRectRadius({ x: 90, y: 250 }, wagon)).toBe(true);
    expect(isWithinLavaSigilRectRadius({ x: 0, y: 0 }, wagon)).toBe(false);
    expect(isWithinLavaSigilRectRadius({ x: 200, y: 250 }, wagon)).toBe(true);
  });

  it('lets weapon geometry hit attackables and consumes bow penetration on each target', () => {
    const run = createRunState('archer');
    const weapons = new WeaponSystem();
    const first = makeSigilTarget('first', 100);
    const second = makeSigilTarget('second', 145);
    const defeated = vi.fn();

    weapons.update(run, { x: 0, y: 0 }, [], 16, () => 0, undefined, { x: 200, y: 0 }, undefined, undefined, [first, second], defeated);
    weapons.update(run, { x: 0, y: 0 }, [], 300, () => 0, undefined, { x: 200, y: 0 }, undefined, undefined, [first, second], defeated);

    expect(first.hp).toBe(2);
    expect(second.hp).toBe(3);
    expect(defeated).not.toHaveBeenCalled();
  });

  it('does not count the same sigil twice for one penetrating arrow', () => {
    const run = createRunState('archer');
    run.upgradeStats['bow-penetration'] = 2;
    const weapons = new WeaponSystem();
    const target = makeSigilTarget('one-sigil', 50);
    weapons.update(run, { x: 0, y: 0 }, [], 16, () => 0, undefined, { x: 100, y: 0 }, undefined, undefined, [target]);
    weapons.update(run, { x: 0, y: 0 }, [], 100, () => 0, undefined, { x: 100, y: 0 }, undefined, undefined, [target]);
    weapons.update(run, { x: 0, y: 0 }, [], 100, () => 0, undefined, { x: 100, y: 0 }, undefined, undefined, [target]);
    expect(target.hp).toBe(2);
  });

  it('counts spread projectiles as separate impacts on an attackable', () => {
    const run = createRunState('merchant');
    const weapons = new WeaponSystem();
    const target = makeSigilTarget('sigil', 50);

    weapons.update(run, { x: 0, y: 0 }, [], 16, () => 0.5, undefined, { x: 100, y: 0 }, undefined, undefined, [target]);
    expect(target.hp).toBe(0);
    expect(target.dead).toBe(true);
  });

  it('routes sword swings and fireball impact areas through the same attackable target interface', () => {
    const warriorRun = createRunState('warrior');
    const swordTarget = makeSigilTarget('sword-sigil', 50);
    new WeaponSystem().update(warriorRun, { x: 0, y: 0 }, [], 16, () => 0, undefined, { x: 100, y: 0 }, undefined, undefined, [swordTarget]);
    expect(swordTarget.hp).toBe(2);

    const mageRun = createRunState('mage');
    mageRun.upgradeStats['fireball-impact-area'] = 50;
    const splashTarget = makeSigilTarget('splash-sigil', 100);
    splashTarget.worldPosition.y = 25;
    new WeaponSystem().update(mageRun, { x: 0, y: 0 }, [], 16, () => 0, undefined, { x: 100, y: 0 }, undefined, undefined, [splashTarget]);
    expect(splashTarget.hp).toBe(2);
  });
});
