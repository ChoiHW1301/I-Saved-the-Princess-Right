import { describe, expect, it } from 'vitest';
import { getXpToNextLevel, RunStateSchema, UpgradeDefinitionSchema } from '../src/index.js';

const runState = {
  runId: 'run-1', status: 'active', elapsedSeconds: 0, characterId: 'hero', level: 1, xp: 0, xpToNext: 10,
  karma: 0, runGold: 0, kills: 0, selectedUpgradeIds: [], weaponLevels: { sword: 1 }, pausedBy: 'none',
  player: { hp: 100, maxHp: 100, isDead: false, respawnMs: 0, invulnerableMs: 0 }, caravan: { hp: 250, maxHp: 250 },
  pendingChoices: [], pendingLevelUps: 0, upgradeStats: {},
};

describe('gameplay contracts', () => {
  it('validates run progression and survival state', () => {
    expect(RunStateSchema.parse(runState).xpToNext).toBe(10);
    expect(() => RunStateSchema.parse({ ...runState, xp: -1 })).toThrow();
    expect(() => RunStateSchema.parse({ ...runState, characterId: 'unknown' })).toThrow();
  });
  it('validates upgrade definitions and level-value counts', () => {
    const upgrade = { id: 'sword', name: 'Sword', description: 'More damage', maxLevel: 2,
      appliesTo: 'weapon', stat: 'damage', values: [2, 4], weight: 1 };
    expect(UpgradeDefinitionSchema.parse(upgrade).maxLevel).toBe(2);
    expect(() => UpgradeDefinitionSchema.parse({ ...upgrade, values: [2] })).toThrow();
  });
  it('keeps the configured level requirement formula deterministic', () => {
    expect([1, 2, 3, 4].map(getXpToNextLevel)).toEqual([10, 17, 28, 43]);
    expect(() => getXpToNextLevel(0)).toThrow();
  });
});
