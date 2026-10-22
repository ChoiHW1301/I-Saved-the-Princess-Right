import type { MetaUpgradeId, PassiveId } from '@caravan/contracts';

export interface MetaUpgradeDefinition { id: MetaUpgradeId; maxLevel: number; baseCost: number; costGrowth: number; stat: string; valuePerLevel: number }
export interface PassiveDefinition { id: PassiveId; cost: number; description: string }

export const metaUpgradeCatalog: Readonly<Record<MetaUpgradeId, MetaUpgradeDefinition>> = {
  'max-health': { id: 'max-health', maxLevel: 5, baseCost: 100, costGrowth: 1.65, stat: 'max-health', valuePerLevel: 10 },
  'attack-damage': { id: 'attack-damage', maxLevel: 5, baseCost: 150, costGrowth: 1.7, stat: 'attack-damage', valuePerLevel: 0.05 },
  'move-speed': { id: 'move-speed', maxLevel: 5, baseCost: 100, costGrowth: 1.6, stat: 'move-speed', valuePerLevel: 6 },
  'wagon-max-health': { id: 'wagon-max-health', maxLevel: 5, baseCost: 125, costGrowth: 1.65, stat: 'wagon-max-health', valuePerLevel: 20 },
};

export const passiveCatalog: Readonly<Record<PassiveId, PassiveDefinition>> = {
  'iron-will': { id: 'iron-will', cost: 300, description: 'Gain a small amount of damage reflection.' },
  'keen-edge': { id: 'keen-edge', cost: 350, description: 'Increase all weapon damage.' },
  'swift-step': { id: 'swift-step', cost: 275, description: 'Move faster from the start of a run.' },
};
