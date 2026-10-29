import { PlayerProfileSchema, RunReceiptDocumentSchema, type PlayerProfile, type RunReceiptDocument } from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import { getGameContainers } from './cosmosClient.js';
import { asContainer, cosmosStatus, mapStorageFailure, StorageError, stripCosmosMetadata, type ContainerPort } from './repositorySupport.js';

export interface ProfileRepositoryPort {
  getOrCreate(caller: Caller): Promise<PlayerProfile>;
  save(profile: PlayerProfile): Promise<void>;
  applyRunOnce(caller: Caller, receipt: RunReceiptDocument, updatedProfile: PlayerProfile): Promise<boolean>;
  getRunReceipt(userId: string, runId: string): Promise<RunReceiptDocument | null>;
}

function userIdFor(caller: Caller): string {
  return `${caller.tenantId.toLowerCase()}:${caller.objectId.toLowerCase()}`;
}

function clientProfile(document: unknown): PlayerProfile {
  return PlayerProfileSchema.parse(document);
}

function fromResponse(response: { resource?: unknown; etag?: string }): { profile: PlayerProfile; etag?: string } | null {
  if (!response.resource) return null;
  return { profile: clientProfile(stripCosmosMetadata(response.resource)), etag: response.etag };
}

export class ProfileRepository implements ProfileRepositoryPort {
  private readonly container: ContainerPort;

  constructor(container: unknown = getGameContainers().profiles) {
    this.container = asContainer(container);
  }

  async getOrCreate(caller: Caller): Promise<PlayerProfile> {
    const userId = userIdFor(caller);
    try {
      const found = fromResponse(await this.container.item('profile', userId).read());
      if (found) return found.profile;
    } catch (error) {
      if (cosmosStatus(error) !== 404) mapStorageFailure(error);
    }

    const profile = PlayerProfileSchema.parse({
      id: 'profile',
      userId,
      tenantId: caller.tenantId,
      objectId: caller.objectId,
      version: 1,
      displayName: caller.displayName,
      goldBalance: 0,
      lifetimeGoldEarned: 0,
      unlockedCharacters: ['warrior'],
      permanentUpgradeLevels: {},
      characterTrainingLevels: {},
      passiveIds: [],
      updatedAt: new Date().toISOString(),
    });
    try {
      await this.container.items.create(profile);
      return profile;
    } catch (error) {
      if (cosmosStatus(error) === 409) {
        const raced = fromResponse(await this.container.item('profile', userId).read());
        if (raced) return raced.profile;
      }
      mapStorageFailure(error);
    }
  }

  async save(profile: PlayerProfile): Promise<void> {
    const safeProfile = clientProfile(profile);
    try {
      const current = fromResponse(await this.container.item('profile', profile.userId).read());
      if (!current?.etag || safeProfile.version !== current.profile.version + 1) {
        throw new StorageError('PROFILE_CONFLICT');
      }
      await this.container.item('profile', profile.userId).replace(safeProfile, { ifMatch: current.etag });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      mapStorageFailure(error, 'PROFILE_CONFLICT');
    }
  }

  async applyRunOnce(caller: Caller, receipt: RunReceiptDocument, updatedProfile: PlayerProfile): Promise<boolean> {
    const userId = userIdFor(caller);
    const safeReceipt = RunReceiptDocumentSchema.parse(receipt);
    const safeProfile = clientProfile(updatedProfile);
    if (safeReceipt.userId !== userId || safeProfile.userId !== userId || safeReceipt.id !== `run:${safeReceipt.runId}`) {
      throw new TypeError('Run receipt and profile must belong to the authenticated caller.');
    }

    try {
      const current = fromResponse(await this.container.item('profile', userId).read());
      if (!current?.etag || safeProfile.version !== current.profile.version + 1) {
        throw new StorageError('PROFILE_CONFLICT');
      }
      const result = await this.container.items.batch(userId)
        .create(safeReceipt)
        .replace('profile', safeProfile, { ifMatch: current.etag })
        .execute();
      if (result.statusCode === 409) return false;
      if (result.statusCode === 412) throw new StorageError('PROFILE_CONFLICT');
      if (result.statusCode !== undefined && result.statusCode >= 400) {
        mapStorageFailure({ statusCode: result.statusCode });
      }
      return true;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (cosmosStatus(error) === 409) return false;
      mapStorageFailure(error, 'PROFILE_CONFLICT');
    }
  }

  async getRunReceipt(userId: string, runId: string): Promise<RunReceiptDocument | null> {
    try {
      const response = await this.container.item(`run:${runId}`, userId).read<RunReceiptDocument>();
      if (!response.resource) return null;
      return RunReceiptDocumentSchema.parse(stripCosmosMetadata(response.resource));
    } catch (error) {
      if (cosmosStatus(error) === 404) return null;
      mapStorageFailure(error);
    }
  }
}
