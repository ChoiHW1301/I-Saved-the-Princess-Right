import { type MetaUpgradeId, type PassiveId, type PlayerProfile, type RunEndingSummary, type RunState } from '@caravan/contracts';
import { metaUpgradeCatalog, getUpgradeCost } from '../content/metaProgression.js';
export { getUpgradeCost } from '../content/metaProgression.js';

export function applyPermanentUpgrade(profile: PlayerProfile, run: RunState): RunState {
  const levels = profile.permanentUpgradeLevels;
  const maxHealth = (levels['max-health'] ?? 0) * metaUpgradeCatalog['max-health'].valuePerLevel;
  const moveSpeed = (levels['move-speed'] ?? 0) * metaUpgradeCatalog['move-speed'].valuePerLevel;
  const wagonHealth = (levels['wagon-max-health'] ?? 0) * metaUpgradeCatalog['wagon-max-health'].valuePerLevel;
  const attackBonus = (levels['attack-damage'] ?? 0) * metaUpgradeCatalog['attack-damage'].valuePerLevel;
  run.player.maxHp += maxHealth;
  run.player.hp += maxHealth;
  run.caravan.maxHp += wagonHealth;
  run.caravan.hp += wagonHealth;
  run.upgradeStats['movement-speed'] = (run.upgradeStats['movement-speed'] ?? 0) + moveSpeed;
  run.upgradeStats['global-damage-multiplier'] = (run.upgradeStats['global-damage-multiplier'] ?? 0) + attackBonus;
  return run;
}

export function checkUnlocks(profile: PlayerProfile, run: UnlockRunSummary): PlayerProfile {
  const unlocked = new Set(profile.unlockedCharacters);
  unlocked.add('archer');
  if (run.status === 'won') unlocked.add('mage');
  return { ...profile, unlockedCharacters: [...unlocked] };
}

export function purchaseMetaUpgrade(profile: PlayerProfile, upgradeId: MetaUpgradeId): PlayerProfile {
  const definition = metaUpgradeCatalog[upgradeId];
  if (!definition) throw new RangeError('INVALID_UPGRADE');
  const currentLevel = profile.permanentUpgradeLevels[upgradeId] ?? 0;
  if (currentLevel >= definition.maxLevel) throw new RangeError('INVALID_UPGRADE');
  const cost = getUpgradeCost(definition, currentLevel);
  if (profile.goldBalance < cost) throw new RangeError('INSUFFICIENT_GOLD');
  return { ...profile, version: profile.version + 1, goldBalance: profile.goldBalance - cost,
    permanentUpgradeLevels: { ...profile.permanentUpgradeLevels, [upgradeId]: currentLevel + 1 }, updatedAt: new Date().toISOString() };
}

export function purchasePassive(_profile: PlayerProfile, _passiveId: PassiveId): PlayerProfile {
  throw new RangeError('INVALID_UPGRADE');
}

export interface UnlockRunSummary extends Pick<RunEndingSummary, 'status' | 'endingId' | 'karma' | 'characterId' | 'kills' | 'elapsedSeconds' | 'runId'> { goldAward: number }
