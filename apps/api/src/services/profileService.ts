import {
  MetaUpgradeIdSchema,
  PassiveIdSchema,
  MERCHANT_RECRUIT_COST,
  type MetaUpgradeId,
  type PassiveId,
  type PlayerProfile,
} from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import { ApiError } from '../http/responses.js';
import type { ProfileRepositoryPort } from '../data/profileRepository.js';
import { StorageError } from '../data/repositorySupport.js';

export interface UpgradeDefinition {
  baseCost: number;
  costGrowth: number;
  maxLevel: number;
}

export const upgradeCatalog: Readonly<Record<MetaUpgradeId, UpgradeDefinition>> = Object.freeze({
  'max-health': { baseCost: 100, costGrowth: 1.65, maxLevel: 5 },
  'attack-damage': { baseCost: 150, costGrowth: 1.7, maxLevel: 5 },
  'move-speed': { baseCost: 100, costGrowth: 1.6, maxLevel: 5 },
  'wagon-max-health': { baseCost: 125, costGrowth: 1.65, maxLevel: 5 },
});

export const passiveCatalog: Readonly<Record<PassiveId, { cost: number }>> = Object.freeze({
  'iron-will': { cost: 300 }, 'keen-edge': { cost: 350 }, 'swift-step': { cost: 275 },
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
    const cost = Math.ceil(definition.baseCost * definition.costGrowth ** currentLevel);
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

  async purchasePassive(caller: Caller, passiveId: PassiveId, expectedProfileVersion: number): Promise<PlayerProfile> {
    const parsedPassive = PassiveIdSchema.safeParse(passiveId);
    if (!parsedPassive.success) throw new ApiError(400, 'INVALID_UPGRADE');
    const current = await this.profiles.getOrCreate(caller);
    if (current.version !== expectedProfileVersion) throw new StorageError('PROFILE_CONFLICT');
    if (current.passiveIds.includes(parsedPassive.data)) throw new ApiError(400, 'INVALID_UPGRADE');
    const cost = passiveCatalog[parsedPassive.data].cost;
    if (current.goldBalance < cost) throw new ApiError(409, 'INSUFFICIENT_GOLD');
    const upgraded: PlayerProfile = {
      ...current, version: current.version + 1, goldBalance: current.goldBalance - cost,
      passiveIds: [...current.passiveIds, parsedPassive.data], updatedAt: new Date().toISOString(),
    };
    await this.profiles.save(upgraded);
    return upgraded;
  }

  async recruitMerchant(caller: Caller, expectedProfileVersion: number): Promise<PlayerProfile> {
    const current = await this.profiles.getOrCreate(caller);
    if (current.version !== expectedProfileVersion) throw new StorageError('PROFILE_CONFLICT');
    if (current.unlockedCharacters.includes('merchant')) throw new ApiError(400, 'INVALID_UPGRADE');
    if (current.goldBalance < MERCHANT_RECRUIT_COST) throw new ApiError(409, 'INSUFFICIENT_GOLD');
    const recruited: PlayerProfile = {
      ...current,
      version: current.version + 1,
      goldBalance: current.goldBalance - MERCHANT_RECRUIT_COST,
      unlockedCharacters: [...current.unlockedCharacters, 'merchant'],
      updatedAt: new Date().toISOString(),
    };
    await this.profiles.save(recruited);
    return recruited;
  }
}
