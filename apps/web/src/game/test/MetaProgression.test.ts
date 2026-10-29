import { describe, expect, it } from 'vitest';
import type { PlayerProfile } from '@caravan/contracts';
import { createRunState } from '../state/createRunState.js';
import { applyPermanentUpgrade, checkUnlocks, getUpgradeCost, purchaseMetaUpgrade, purchasePassive, type UnlockRunSummary } from '../systems/MetaProgression.js';
import { metaUpgradeCatalog } from '../content/metaProgression.js';

const profile: PlayerProfile = {
  id: 'profile', userId: 'user', tenantId: 'tenant', objectId: 'object', version: 1, displayName: 'Player',
  goldBalance: 1000, lifetimeGoldEarned: 499, unlockedCharacters: ['warrior'], permanentUpgradeLevels: {}, passiveIds: [], characterTrainingLevels: {}, updatedAt: '2026-10-22T00:00:00.000Z',
};

describe('gold meta progression', () => {
  it('uses fixed rank prices and applies permanent stats at run start', () => {
    const definition = metaUpgradeCatalog['max-health'];
    expect(getUpgradeCost(definition, 0)).toBe(100);
    expect(getUpgradeCost(definition, 1)).toBe(125);
    const upgraded = purchaseMetaUpgrade(profile, 'max-health');
    expect(upgraded.goldBalance).toBe(900);
    const run = createRunState();
    applyPermanentUpgrade({ ...profile, permanentUpgradeLevels: { 'max-health': 2, 'wagon-max-health': 1 } }, run);
    expect(run.player).toMatchObject({ hp: 120, maxHp: 120 });
    expect(run.caravan).toMatchObject({ hp: 270, maxHp: 270 });
  });

  it('unlocks archer after any run and mage after a clear; merchant is recruited in the shop', () => {
    const result: UnlockRunSummary = { runId: 'run', characterId: 'warrior', endingId: 'caravan-lost', karma: 0, kills: 0, elapsedSeconds: 10, status: 'lost', goldAward: 1 };
    const lost = checkUnlocks(profile, result);
    expect(lost.unlockedCharacters).toEqual(['warrior', 'archer']);
    expect(checkUnlocks(profile, { ...result, status: 'won', endingId: 'princess-purified', goldAward: 0 }).unlockedCharacters).toEqual(['warrior', 'archer', 'mage']);
  });

  it('limits permanent upgrades and rejects retired passive purchases', () => {
    expect(() => purchasePassive(profile, 'iron-will')).toThrow('INVALID_UPGRADE');
    expect(() => purchaseMetaUpgrade({ ...profile, goldBalance: 0 }, 'move-speed')).toThrow('INSUFFICIENT_GOLD');
    let atCap = { ...profile, permanentUpgradeLevels: { 'max-health': 5 } };
    expect(() => purchaseMetaUpgrade(atCap, 'max-health')).toThrow('INVALID_UPGRADE');
  });
});
