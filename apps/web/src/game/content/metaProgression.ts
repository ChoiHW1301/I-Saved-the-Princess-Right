import { commonUpgradeCatalog, type CommonUpgradeDefinition } from '@caravan/contracts';

export const metaUpgradeCatalog = commonUpgradeCatalog;
export type MetaUpgradeDefinition = CommonUpgradeDefinition;

export function getUpgradeCost(definition: MetaUpgradeDefinition, currentLevel: number): number {
  if (!Number.isInteger(currentLevel) || currentLevel < 0 || currentLevel >= definition.maxLevel) {
    throw new RangeError('Upgrade level is outside its purchase range.');
  }
  const cost = definition.rankCosts[currentLevel];
  if (cost === undefined) throw new RangeError('Upgrade level is outside its purchase range.');
  return cost;
}
