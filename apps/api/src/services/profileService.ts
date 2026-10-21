import {
  MetaUpgradeIdSchema,
  type MetaUpgradeId,
  type PlayerProfile,
} from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import { ApiError } from '../http/responses.js';
import type { ProfileRepositoryPort } from '../data/profileRepository.js';
import { StorageError } from '../data/repositorySupport.js';

export interface UpgradeDefinition {
  baseCost: number;
  maxLevel: number;
}

export const upgradeCatalog: Readonly<Record<MetaUpgradeId, UpgradeDefinition>> = Object.freeze({
  'max-health': { baseCost: 100, maxLevel: 5 },
  armor: { baseCost: 150, maxLevel: 5 },
  damage: { baseCost: 200, maxLevel: 5 },
  magnet: { baseCost: 75, maxLevel: 5 },
  'starting-gold': { baseCost: 250, maxLevel: 5 },
});

export interface PurchaseUpgradeRequest {
  upgradeId: MetaUpgradeId;
  expectedProfileVersion: number;
}

export class ProfileService {
  constructor(private readonly profiles: ProfileRepositoryPort) {}

  getProfile(caller: Caller): Promise<PlayerProfile> {
    return this.profiles.getOrCreate(caller);
  }

  async purchaseUpgrade(caller: Caller, request: PurchaseUpgradeRequest): Promise<PlayerProfile> {
    const parsedUpgrade = MetaUpgradeIdSchema.safeParse(request.upgradeId);
    if (!parsedUpgrade.success) throw new ApiError(400, 'INVALID_UPGRADE');

    const current = await this.profiles.getOrCreate(caller);
    if (current.version !== request.expectedProfileVersion) throw new StorageError('PROFILE_CONFLICT');
    const definition = upgradeCatalog[parsedUpgrade.data];
    const currentLevel = current.permanentUpgradeLevels[parsedUpgrade.data] ?? 0;
    if (currentLevel >= definition.maxLevel) throw new ApiError(400, 'INVALID_UPGRADE');
    const cost = definition.baseCost * (currentLevel + 1);
    if (current.goldBalance < cost) throw new ApiError(409, 'INSUFFICIENT_GOLD');

    const upgraded: PlayerProfile = {
      ...current,
      version: current.version + 1,
      goldBalance: current.goldBalance - cost,
      permanentUpgradeLevels: { ...current.permanentUpgradeLevels, [parsedUpgrade.data]: currentLevel + 1 },
      updatedAt: new Date().toISOString(),
    };
    await this.profiles.save(upgraded);
    return upgraded;
  }
}
