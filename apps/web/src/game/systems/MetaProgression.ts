import { MERCHANT_GOLD_THRESHOLD, type MetaUpgradeId, type PassiveId, type PlayerProfile, type RunEndingSummary, type RunState } from '@caravan/contracts';
import { metaUpgradeCatalog, passiveCatalog, type MetaUpgradeDefinition } from '../content/metaProgression.js';

export function getUpgradeCost(definition: MetaUpgradeDefinition, currentLevel: number): number {
  if (!Number.isInteger(currentLevel) || currentLevel < 0 || currentLevel >= definition.maxLevel) throw new RangeError('Upgrade level is outside its purchase range.');
  return Math.ceil(definition.baseCost * definition.costGrowth ** currentLevel);
}

export function applyPermanentUpgrade(profile: PlayerProfile, run: RunState): RunState {
  const levels = profile.permanentUpgradeLevels;
  const maxHealth = (levels['max-health'] ?? 0) * metaUpgradeCatalog['max-health'].valuePerLevel;
  const moveSpeed = (levels['move-speed'] ?? 0) * metaUpgradeCatalog['move-speed'].valuePerLevel;
  const wagonHealth = (levels['wagon-max-health'] ?? 0) * metaUpgradeCatalog['wagon-max-health'].valuePerLevel;
  const attackBonus = (levels['attack-damage'] ?? 0) * metaUpgradeCatalog['attack-damage'].valuePerLevel;
  const passiveIds = new Set(profile.passiveIds);
  run.player.maxHp += maxHealth;
  run.player.hp += maxHealth;
  run.caravan.maxHp += wagonHealth;
  run.caravan.hp += wagonHealth;
  run.upgradeStats['movement-speed'] = (run.upgradeStats['movement-speed'] ?? 0) + moveSpeed;
  run.upgradeStats['global-damage-multiplier'] = (run.upgradeStats['global-damage-multiplier'] ?? 0) + attackBonus + (passiveIds.has('keen-edge') ? 0.05 : 0);
  run.upgradeStats['hero-reflect'] = (run.upgradeStats['hero-reflect'] ?? 0) + (passiveIds.has('iron-will') ? 2 : 0);
  run.upgradeStats['movement-speed'] += passiveIds.has('swift-step') ? 8 : 0;
  return run;
}

export function checkUnlocks(profile: PlayerProfile, run: UnlockRunSummary): PlayerProfile {
  const unlocked = new Set(profile.unlockedCharacters);
  unlocked.add('archer');
  if (run.status === 'won') unlocked.add('mage');
  if (profile.lifetimeGoldEarned + run.goldAward >= MERCHANT_GOLD_THRESHOLD) unlocked.add('merchant');
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

export function purchasePassive(profile: PlayerProfile, passiveId: PassiveId): PlayerProfile {
  const definition = passiveCatalog[passiveId];
  if (!definition || profile.passiveIds.includes(passiveId)) throw new RangeError('INVALID_UPGRADE');
  if (profile.goldBalance < definition.cost) throw new RangeError('INSUFFICIENT_GOLD');
  return { ...profile, version: profile.version + 1, goldBalance: profile.goldBalance - definition.cost,
    passiveIds: [...profile.passiveIds, passiveId], updatedAt: new Date().toISOString() };
}

export interface UnlockRunSummary extends Pick<RunEndingSummary, 'status' | 'endingId' | 'karma' | 'characterId' | 'kills' | 'elapsedSeconds' | 'runId'> { goldAward: number }
