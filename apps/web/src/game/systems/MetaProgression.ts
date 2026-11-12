import { type MetaUpgradeId, type PassiveId, type PlayerProfile, type RunEndingSummary, type RunState } from '@caravan/contracts';
import { metaUpgradeCatalog, getUpgradeCost } from '../content/metaProgression.js';
export { getUpgradeCost } from '../content/metaProgression.js';

export function applyPermanentUpgrade(profile: PlayerProfile, run: RunState): RunState {
  const levels = profile.permanentUpgradeLevels;
  for (const item of Object.values(metaUpgradeCatalog)) {
    const rank = Math.min(item.maxLevel, levels[item.id] ?? 0);
    const value = rank * item.valuePerLevel;
    if (value <= 0) continue;
    switch (item.id) {
      case 'max-health':
        run.player.maxHp += value;
        run.player.hp += value;
        break;
      case 'wagon-max-health':
        run.caravan.maxHp += value;
        run.caravan.hp += value;
        break;
      case 'move-speed': run.upgradeStats['movement-speed'] = value; break;
      case 'attack-damage': run.upgradeStats['global-damage-multiplier'] = value; break;
      case 'critical-chance': run.upgradeStats['critical-chance'] = value; break;
      case 'attack-speed': run.upgradeStats['attack-speed'] = value; break;
      case 'health-regeneration': run.upgradeStats['health-regeneration'] = value; break;
      case 'xp-gain': run.upgradeStats['xp-gain'] = value; break;
      case 'gold-gain': run.upgradeStats['gold-gain'] = value; break;
      case 'defense': run.upgradeStats['damage-reduction'] = value; break;
      case 'extra-lives': run.player.respawnsRemaining = Math.min(3, rank); break;
    }
  }
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
