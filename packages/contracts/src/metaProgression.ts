import type { CharacterId, MetaUpgradeId, TrainingId } from './profile.js';

export const COMMON_UPGRADE_RANK_COSTS = [100, 125, 150, 175, 200] as const;
export type RankCosts = readonly number[];

export interface CommonUpgradeDefinition {
  id: MetaUpgradeId;
  maxLevel: 5;
  valuePerLevel: number;
  rankCosts: typeof COMMON_UPGRADE_RANK_COSTS;
}

export const commonUpgradeCatalog = {
  'max-health': { id: 'max-health', maxLevel: 5, valuePerLevel: 10, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'attack-damage': { id: 'attack-damage', maxLevel: 5, valuePerLevel: 0.05, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'critical-chance': { id: 'critical-chance', maxLevel: 5, valuePerLevel: 0.02, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'move-speed': { id: 'move-speed', maxLevel: 5, valuePerLevel: 6, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'attack-speed': { id: 'attack-speed', maxLevel: 5, valuePerLevel: 0.1, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'health-regeneration': { id: 'health-regeneration', maxLevel: 5, valuePerLevel: 0.2, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'wagon-max-health': { id: 'wagon-max-health', maxLevel: 5, valuePerLevel: 20, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'xp-gain': { id: 'xp-gain', maxLevel: 5, valuePerLevel: 0.05, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'gold-gain': { id: 'gold-gain', maxLevel: 5, valuePerLevel: 0.05, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  defense: { id: 'defense', maxLevel: 5, valuePerLevel: 0.02, rankCosts: COMMON_UPGRADE_RANK_COSTS },
} satisfies Record<MetaUpgradeId, CommonUpgradeDefinition>;

export interface CharacterTrainingDefinition {
  id: TrainingId;
  characterId: CharacterId;
  kind: 'ranked' | 'unlock';
  maxLevel: number;
  rankCosts: RankCosts;
}

export const characterTrainingCatalog = {
  'warrior-thorn-armor': { id: 'warrior-thorn-armor', characterId: 'warrior', kind: 'ranked', maxLevel: 5, rankCosts: COMMON_UPGRADE_RANK_COSTS },
  'archer-dash': { id: 'archer-dash', characterId: 'archer', kind: 'unlock', maxLevel: 1, rankCosts: [500] },
  'mage-wind-spirit': { id: 'mage-wind-spirit', characterId: 'mage', kind: 'unlock', maxLevel: 1, rankCosts: [500] },
  'merchant-money-bomb': { id: 'merchant-money-bomb', characterId: 'merchant', kind: 'ranked', maxLevel: 5, rankCosts: COMMON_UPGRADE_RANK_COSTS },
} satisfies Record<TrainingId, CharacterTrainingDefinition>;
