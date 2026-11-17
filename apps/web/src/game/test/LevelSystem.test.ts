import { describe, expect, it } from 'vitest';
import { createRunState } from '../state/createRunState.js';
import { LevelSystem } from '../systems/LevelSystem.js';
import { getAvailableUpgrades, upgradeCatalog } from '../content/upgrades.js';

describe('run XP and level-up choices', () => {
  it('only offers the selected warrior evolution and stops at its maximum rank', () => {
    const run = createRunState('warrior');
    const ids = ['whirlwind-damage', 'multi-sword-count', 'sword-wave-penetration', 'vanguard-heat'];
    expect(getAvailableUpgrades('warrior', run).filter(({ id }) => ids.includes(id))).toHaveLength(0);
    run.warriorEvolutionId = 'multi-sword';
    expect(getAvailableUpgrades('warrior', run).filter(({ id }) => ids.includes(id)).map(({ id }) => id)).toEqual(['multi-sword-count']);
    const injected = new LevelSystem(() => 0, upgradeCatalog.filter(({ id }) => ids.includes(id)));
    expect(injected.rollChoices(run).map(({ id }) => id)).toEqual(['multi-sword-count']);
    run.weaponLevels['multi-sword-count'] = 3;
    expect(injected.rollChoices(run)).toEqual([]);
    expect(getAvailableUpgrades('warrior', run).some(({ id }) => id === 'multi-sword-count')).toBe(false);
    const archer = createRunState('archer');
    expect(getAvailableUpgrades('archer', archer).some(({ id }) => ids.includes(id))).toBe(false);
  });
  it('uses the configured increasing thresholds and carries XP remainder', () => {
    const run = createRunState();
    const levels = new LevelSystem(() => 0);
    expect(levels.addXp(run, 9).levelUps).toBe(0);
    const gained = levels.addXp(run, 3);
    expect(gained.levelUps).toBe(1);
    expect(run).toMatchObject({ level: 2, xp: 2, xpToNext: 17, pausedBy: 'level-up' });
    expect(run.pendingChoices).toHaveLength(3);
  });
  it('offers only eligible upgrades and applies one valid choice exactly once', () => {
    const run = createRunState('warrior');
    const levels = new LevelSystem(() => 0);
    levels.addXp(run, 10);
    expect(run.pendingChoices.every((choice) => !choice.id.startsWith('projectile-'))).toBe(true);
    expect(levels.applyChoice(run, 'not-offered')).toBe(false);
    const chosen = run.pendingChoices[0]!;
    expect(levels.applyChoice(run, chosen.id)).toBe(true);
    expect(levels.applyChoice(run, chosen.id)).toBe(false);
    expect(run.weaponLevels[chosen.id]).toBe(1);
    expect(run.selectedUpgradeIds).toEqual([chosen.id]);
    expect(run.pausedBy).toBe('none');
  });
  it('queues multiple levels without opening duplicate pending overlays', () => {
    const run = createRunState();
    const levels = new LevelSystem(() => 0);
    expect(levels.addXp(run, 27).levelUps).toBe(2);
    expect(run.pendingLevelUps).toBe(2);
    expect(run.pendingChoices).toHaveLength(3);
    const firstId = run.pendingChoices[0]!.id;
    expect(levels.applyChoice(run, firstId)).toBe(true);
    expect(levels.presentNextChoice(run)).toHaveLength(3);
    expect(run.pausedBy).toBe('level-up');
    expect(levels.applyChoice(run, run.pendingChoices[0]!.id)).toBe(true);
    expect(run.pendingLevelUps).toBe(0);
    expect(run.pendingChoices).toHaveLength(0);
    expect(run.pausedBy).toBe('none');
  });
  it('ignores invalid XP and starts a new run without old progression', () => {
    const run = createRunState();
    const levels = new LevelSystem(() => 0);
    expect(levels.addXp(run, -4).levelUps).toBe(0);
    expect(levels.addXp(run, 1.5).levelUps).toBe(0);
    const nextRun = createRunState();
    expect(nextRun).toMatchObject({ level: 1, xp: 0, selectedUpgradeIds: [], weaponLevels: { sword: 1 } });
  });
});
