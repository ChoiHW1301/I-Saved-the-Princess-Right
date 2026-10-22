import { describe, expect, it } from 'vitest';
import type { PlayerProfile } from '@caravan/contracts';
import { createRunState } from '../state/createRunState.js';
import { applyPermanentUpgrade, checkUnlocks, getUpgradeCost, purchaseMetaUpgrade, purchasePassive, type UnlockRunSummary } from '../systems/MetaProgression.js';
import { metaUpgradeCatalog } from '../content/metaProgression.js';

const profile: PlayerProfile = {
  id: 'profile', userId: 'user', tenantId: 'tenant', objectId: 'object', version: 1, displayName: 'Player',
  goldBalance: 1000, lifetimeGoldEarned: 499, unlockedCharacters: ['hero'], permanentUpgradeLevels: {}, passiveIds: [], updatedAt: '2026-10-22T00:00:00.000Z',
};

describe('gold meta progression', () => {
  it('uses geometric integer prices and applies permanent stats at run start', () => {
    const definition = metaUpgradeCatalog['max-health'];
    expect(getUpgradeCost(definition, 0)).toBe(100);
    expect(getUpgradeCost(definition, 1)).toBe(165);
    const upgraded = purchaseMetaUpgrade(profile, 'max-health');
    expect(upgraded.goldBalance).toBe(900);
    const run = createRunState();
    applyPermanentUpgrade({ ...profile, permanentUpgradeLevels: { 'max-health': 2, 'wagon-max-health': 1 } }, run);
    expect(run.player).toMatchObject({ hp: 120, maxHp: 120 });
    expect(run.caravan).toMatchObject({ hp: 270, maxHp: 270 });
  });

  it('unlocks archer after any run, mage after a clear, and merchant at the gold threshold', () => {
    const result: UnlockRunSummary = { runId: 'run', characterId: 'hero', endingId: 'caravan-lost', karma: 0, kills: 0, elapsedSeconds: 10, status: 'lost', goldAward: 1 };
    const lost = checkUnlocks(profile, result);
    expect(lost.unlockedCharacters).toEqual(['hero', 'archer', 'merchant']);
    expect(checkUnlocks(profile, { ...result, status: 'won', endingId: 'princess-purified', goldAward: 0 }).unlockedCharacters).toEqual(['hero', 'archer', 'mage']);
  });

  it('limits permanent upgrades and one-time passive purchases by balance', () => {
    const passive = purchasePassive(profile, 'iron-will');
    expect(passive).toMatchObject({ goldBalance: 700, passiveIds: ['iron-will'] });
    expect(() => purchasePassive(passive, 'iron-will')).toThrow('INVALID_UPGRADE');
    expect(() => purchaseMetaUpgrade({ ...profile, goldBalance: 0 }, 'move-speed')).toThrow('INSUFFICIENT_GOLD');
    let atCap = { ...profile, permanentUpgradeLevels: { 'max-health': 5 } };
    expect(() => purchaseMetaUpgrade(atCap, 'max-health')).toThrow('INVALID_UPGRADE');
  });
});
