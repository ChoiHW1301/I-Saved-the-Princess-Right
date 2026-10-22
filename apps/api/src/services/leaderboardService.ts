import {
  CharacterIdSchema,
  KarmaTierSchema,
  type LeaderboardEntry,
} from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import type { LeaderboardRepositoryPort } from '../data/leaderboardRepository.js';
import { ApiError } from '../http/responses.js';
import { userIdFor } from './saveService.js';

export interface PublicLeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  kills: number;
  characterId: string;
  karmaTier: string;
  elapsedSeconds: number;
  clear: boolean;
  updatedAt: string;
}

export interface LeaderboardPage {
  entries: PublicLeaderboardEntry[];
  myRank: number | null;
  totalEntries: number;
}

export class LeaderboardService {
  constructor(private readonly leaderboards: LeaderboardRepositoryPort) {}

  scoreBoard(caller: Caller, limit: number): Promise<LeaderboardPage> {
    return this.read(caller, 'score', limit);
  }

  async clearBoard(caller: Caller, characterId: string, tier: string, limit: number): Promise<LeaderboardPage> {
    const character = CharacterIdSchema.safeParse(characterId);
    const karmaTier = KarmaTierSchema.safeParse(tier);
    if (!character.success || !karmaTier.success) throw new ApiError(400, 'INVALID_LEADERBOARD_FILTER');
    return await this.read(caller, `clear:${character.data}:${karmaTier.data}`, limit);
  }

  private async read(caller: Caller, boardId: string, limit: number): Promise<LeaderboardPage> {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new ApiError(400, 'INVALID_LEADERBOARD_FILTER');
    }
    const [top, all] = await Promise.all([
      this.leaderboards.listTop(boardId, limit),
      this.leaderboards.listAll(boardId),
    ]);
    const sortedAll = [...all].sort(compareEntries);
    const myIndex = sortedAll.findIndex((entry) => entry.userId === userIdFor(caller));
    const entries = top.slice(0, limit).map((entry) => toPublicEntry(entry, sortedAll.findIndex((candidate) => candidate.userId === entry.userId) + 1));
    return { entries, myRank: myIndex < 0 ? null : myIndex + 1, totalEntries: sortedAll.length };
  }
}

function compareEntries(left: LeaderboardEntry, right: LeaderboardEntry): number {
  return right.score - left.score ||
    right.kills - left.kills ||
    right.elapsedSeconds - left.elapsedSeconds ||
    left.displayName.localeCompare(right.displayName);
}

function toPublicEntry(entry: LeaderboardEntry, rank: number): PublicLeaderboardEntry {
  return {
    rank,
    displayName: entry.displayName,
    score: entry.score,
    kills: entry.kills,
    characterId: entry.characterId,
    karmaTier: entry.karmaTier,
    elapsedSeconds: entry.elapsedSeconds,
    clear: entry.clear,
    updatedAt: entry.updatedAt,
  };
}
