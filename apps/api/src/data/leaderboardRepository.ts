import { LeaderboardEntrySchema, type LeaderboardEntry } from '@caravan/contracts';
import { getGameContainers } from './cosmosClient.js';
import { asContainer, mapStorageFailure, type ContainerPort } from './repositorySupport.js';

export interface LeaderboardRepositoryPort {
  upsertBest(entry: LeaderboardEntry): Promise<void>;
  listTop(boardId: string, limit?: number): Promise<LeaderboardEntry[]>;
}

function isBetter(candidate: LeaderboardEntry, current: LeaderboardEntry): boolean {
  return candidate.score > current.score ||
    (candidate.score === current.score && candidate.elapsedSeconds < current.elapsedSeconds) ||
    (candidate.score === current.score && candidate.elapsedSeconds === current.elapsedSeconds &&
      candidate.displayName.localeCompare(current.displayName) < 0);
}

export class LeaderboardRepository implements LeaderboardRepositoryPort {
  private readonly container: ContainerPort;

  constructor(container: unknown = getGameContainers().leaderboards) {
    this.container = asContainer(container);
  }

  async upsertBest(entry: LeaderboardEntry): Promise<void> {
    const candidate = LeaderboardEntrySchema.parse(entry);
    try {
      const response = await this.container.item(candidate.userId, candidate.boardId).read<LeaderboardEntry>();
      if (response.resource) {
        const current = LeaderboardEntrySchema.parse(response.resource);
        if (!isBetter(candidate, current)) return;
      }
      await this.container.items.upsert(candidate);
    } catch (error) {
      if (typeof error === 'object' && error !== null && Number((error as { statusCode?: number }).statusCode) === 404) {
        try {
          await this.container.items.upsert(candidate);
          return;
        } catch (writeError) {
          mapStorageFailure(writeError);
        }
      }
      mapStorageFailure(error);
    }
  }

  async listTop(boardId: string, limit = 10): Promise<LeaderboardEntry[]> {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    try {
      const result = await this.container.items.query<LeaderboardEntry>({
        query: 'SELECT * FROM c WHERE c.boardId = @boardId ORDER BY c.score DESC, c.elapsedSeconds ASC, c.displayName ASC OFFSET 0 LIMIT @limit',
        parameters: [{ name: '@boardId', value: boardId }, { name: '@limit', value: safeLimit }],
      }, { partitionKey: boardId }).fetchAll();
      return result.resources.map((entry) => LeaderboardEntrySchema.parse(entry));
    } catch (error) {
      mapStorageFailure(error);
    }
  }
}
