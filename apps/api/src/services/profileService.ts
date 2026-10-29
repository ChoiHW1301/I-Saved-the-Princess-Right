import {
  MetaUpgradeIdSchema,
  TrainingIdSchema,
  CharacterIdSchema,
  commonUpgradeCatalog,
  characterTrainingCatalog,
  MERCHANT_RECRUIT_COST,
  type MetaUpgradeId,
  type CharacterId,
  type TrainingId,
  type PlayerProfile,
} from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import { ApiError } from '../http/responses.js';
import type { ProfileRepositoryPort } from '../data/profileRepository.js';
import { StorageError } from '../data/repositorySupport.js';

export interface PurchaseUpgradeRequest {
  upgradeId: MetaUpgradeId;
  expectedProfileVersion: number;
}

export interface PurchaseTrainingRequest {
  characterId: CharacterId;
  trainingId: TrainingId;
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
    const definition = commonUpgradeCatalog[parsedUpgrade.data];
    const currentLevel = current.permanentUpgradeLevels[parsedUpgrade.data] ?? 0;
    if (currentLevel >= definition.maxLevel) throw new ApiError(400, 'INVALID_UPGRADE');
    const cost = definition.rankCosts[currentLevel];
    if (cost === undefined) throw new ApiError(400, 'INVALID_UPGRADE');
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

  async purchaseTraining(caller: Caller, request: PurchaseTrainingRequest): Promise<PlayerProfile> {
    const parsedCharacter = CharacterIdSchema.safeParse(request.characterId);
    const parsedTraining = TrainingIdSchema.safeParse(request.trainingId);
    if (!parsedCharacter.success || !parsedTraining.success) throw new ApiError(400, 'INVALID_UPGRADE');
    const current = await this.profiles.getOrCreate(caller);
    if (current.version !== request.expectedProfileVersion) throw new StorageError('PROFILE_CONFLICT');
    if (!current.unlockedCharacters.includes(parsedCharacter.data)) throw new ApiError(400, 'INVALID_UPGRADE');
    const definition = characterTrainingCatalog[parsedTraining.data];
    if (definition.characterId !== parsedCharacter.data) throw new ApiError(400, 'INVALID_UPGRADE');
    const currentLevel = current.characterTrainingLevels[parsedCharacter.data]?.[parsedTraining.data] ?? 0;
    if (currentLevel >= definition.maxLevel) throw new ApiError(400, 'INVALID_UPGRADE');
    const cost = definition.rankCosts[currentLevel];
    if (cost === undefined) throw new ApiError(400, 'INVALID_UPGRADE');
    if (current.goldBalance < cost) throw new ApiError(409, 'INSUFFICIENT_GOLD');
    const upgraded: PlayerProfile = {
      ...current, version: current.version + 1, goldBalance: current.goldBalance - cost,
      characterTrainingLevels: {
        ...current.characterTrainingLevels,
        [parsedCharacter.data]: {
          ...current.characterTrainingLevels[parsedCharacter.data],
          [parsedTraining.data]: currentLevel + 1,
        },
      },
      updatedAt: new Date().toISOString(),
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
