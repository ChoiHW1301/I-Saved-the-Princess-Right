import { CurrentRunSaveV1Schema, type CurrentRunSaveV1 } from '@caravan/contracts';
import { getGameContainers } from './cosmosClient.js';
import { asContainer, cosmosStatus, mapStorageFailure, StorageError, type ContainerPort } from './repositorySupport.js';

export interface SaveRepositoryPort {
  get(userId: string): Promise<CurrentRunSaveV1 | null>;
  put(save: CurrentRunSaveV1, expectedRevision: number | null): Promise<CurrentRunSaveV1>;
  delete(userId: string, expectedRevision: number): Promise<void>;
}

function saveFromResponse(response: { resource?: unknown }): CurrentRunSaveV1 | null {
  if (!response.resource) return null;
  const { _etag: _ignored, ...document } = response.resource as Record<string, unknown>;
  return CurrentRunSaveV1Schema.parse(document);
}

export class SaveRepository implements SaveRepositoryPort {
  private readonly container: ContainerPort;

  constructor(container: unknown = getGameContainers().saves) {
    this.container = asContainer(container);
  }

  async get(userId: string): Promise<CurrentRunSaveV1 | null> {
    try {
      return saveFromResponse(await this.container.item('current', userId).read());
    } catch (error) {
      if (cosmosStatus(error) === 404) return null;
      mapStorageFailure(error);
    }
  }

  async put(save: CurrentRunSaveV1, expectedRevision: number | null): Promise<CurrentRunSaveV1> {
    const parsed = CurrentRunSaveV1Schema.parse(save);
    try {
      const current = await this.get(parsed.userId);
      if (expectedRevision === null) {
        if (current) throw new StorageError('SAVE_CONFLICT');
        const created = { ...parsed, revision: 1 };
        await this.container.items.create(created);
        return created;
      }
      if (!current || current.revision !== expectedRevision) throw new StorageError('SAVE_CONFLICT');
      const currentResponse = await this.container.item('current', parsed.userId).read<Record<string, unknown>>();
      if (!currentResponse.etag) throw new StorageError('SAVE_CONFLICT');
      const updated = { ...parsed, revision: expectedRevision + 1 };
      await this.container.item('current', parsed.userId).replace(updated, { ifMatch: currentResponse.etag });
      return updated;
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if ([404, 409, 412].includes(cosmosStatus(error) ?? 0)) throw new StorageError('SAVE_CONFLICT');
      mapStorageFailure(error, 'SAVE_CONFLICT');
    }
  }

  async delete(userId: string, expectedRevision: number): Promise<void> {
    try {
      const currentResponse = await this.container.item('current', userId).read<Record<string, unknown>>();
      const current = saveFromResponse(currentResponse);
      if (!current) return;
      if (current.revision !== expectedRevision || !currentResponse.etag) throw new StorageError('SAVE_CONFLICT');
      await this.container.item('current', userId).delete({ ifMatch: currentResponse.etag });
    } catch (error) {
      if (error instanceof StorageError) throw error;
      if (cosmosStatus(error) === 404) return;
      mapStorageFailure(error, 'SAVE_CONFLICT');
    }
  }
}
