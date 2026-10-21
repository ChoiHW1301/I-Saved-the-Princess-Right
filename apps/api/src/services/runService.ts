import {
  LeaderboardEntrySchema,
  RunReceiptDocumentSchema,
  RunSubmissionSchema,
  type CharacterId,
  type KarmaTier,
  type LeaderboardEntry,
  type PlayerProfile,
  type RunReceipt,
  type RunReceiptDocument,
  type RunSubmission,
} from '@caravan/contracts';
import type { Caller } from '../auth/authorize.js';
import { goldConfig, merchantUnlockGold, scoreConfig } from '../config/gameRewards.js';
import type { LeaderboardRepositoryPort } from '../data/leaderboardRepository.js';
import type { ProfileRepositoryPort } from '../data/profileRepository.js';
import type { SaveRepositoryPort } from '../data/saveRepository.js';
import { ApiError } from '../http/responses.js';
import { StorageError } from '../data/repositorySupport.js';
import { userIdFor } from './saveService.js';

export function calculateScore(submission: RunSubmission): number {
  return submission.kills * scoreConfig.killWeight +
    submission.elapsedSeconds * scoreConfig.secondWeight +
    submission.defeatedBossIds.length * scoreConfig.bossWeight +
    (submission.status === 'won' ? scoreConfig.clearBonus : 0);
}

export function calculateGoldAward(submission: RunSubmission): number {
  return submission.kills * goldConfig.goldPerKill +
    Math.floor(submission.elapsedSeconds / 60) * goldConfig.survivalGoldPerMinute +
    (submission.status === 'won' ? goldConfig.clearBonus : 0);
}

function karmaTier(karma: number): KarmaTier {
  if (karma <= -50) return 'evil';
  if (karma >= 50) return 'good';
  return 'neutral';
}

function sameSubmission(receipt: RunReceiptDocument, candidate: RunSubmission): boolean {
  return receipt.characterId === candidate.characterId &&
    receipt.status === candidate.status &&
    receipt.elapsedSeconds === candidate.elapsedSeconds &&
    receipt.kills === candidate.kills &&
    receipt.karma === candidate.karma &&
    receipt.endingId === candidate.endingId &&
    receipt.defeatedBossIds.length === candidate.defeatedBossIds.length &&
    receipt.defeatedBossIds.every((bossId, index) => bossId === candidate.defeatedBossIds[index]);
}

export interface RunServiceDependencies {
  profiles: ProfileRepositoryPort;
  leaderboards: LeaderboardRepositoryPort;
  saves: SaveRepositoryPort;
}

export class RunService {
  constructor(private readonly dependencies: RunServiceDependencies) {}

  async submitRun(caller: Caller, input: unknown, correlationId: string): Promise<RunReceipt> {
    const submission = RunSubmissionSchema.parse(input);
    const userId = userIdFor(caller);
    const prior = await this.dependencies.profiles.getRunReceipt(userId, submission.runId);
    if (prior) {
      if (!sameSubmission(prior, submission)) throw new ApiError(409, 'RUN_ID_CONFLICT');
      return this.finishSavedRun(caller, prior, await this.dependencies.profiles.getOrCreate(caller), correlationId, true);
    }

    const profile = await this.dependencies.profiles.getOrCreate(caller);
    if (!profile.unlockedCharacters.includes(submission.characterId)) throw new ApiError(400, 'INVALID_RUN');
    const score = calculateScore(submission);
    const goldAward = calculateGoldAward(submission);
    const unlockedCharacters = unlockCharacters(profile, submission, goldAward);
    const updatedProfile: PlayerProfile = {
      ...profile,
      version: profile.version + 1,
      goldBalance: profile.goldBalance + goldAward,
      lifetimeGoldEarned: profile.lifetimeGoldEarned + goldAward,
      unlockedCharacters,
      updatedAt: new Date().toISOString(),
    };
    const receipt = RunReceiptDocumentSchema.parse({
      id: `run:${submission.runId}`,
      userId,
      runId: submission.runId,
      score,
      goldAward,
      status: submission.status,
      endingId: submission.endingId,
      characterId: submission.characterId,
      elapsedSeconds: submission.elapsedSeconds,
      kills: submission.kills,
      defeatedBossIds: submission.defeatedBossIds,
      karma: submission.karma,
      createdAt: new Date().toISOString(),
    });

    const applied = await this.dependencies.profiles.applyRunOnce(caller, receipt, updatedProfile);
    if (!applied) {
      const racedReceipt = await this.dependencies.profiles.getRunReceipt(userId, submission.runId);
      if (!racedReceipt) throw new StorageError('PROFILE_CONFLICT');
      if (!sameSubmission(racedReceipt, submission)) throw new ApiError(409, 'RUN_ID_CONFLICT');
      return this.finishSavedRun(caller, racedReceipt, await this.dependencies.profiles.getOrCreate(caller), correlationId, true);
    }
    return this.finishSavedRun(caller, receipt, updatedProfile, correlationId, false);
  }

  private async finishSavedRun(
    caller: Caller,
    receipt: RunReceiptDocument,
    profile: PlayerProfile,
    correlationId: string,
    replayed: boolean,
  ): Promise<RunReceipt> {
    const entries = createLeaderboardEntries(caller, profile.displayName, receipt);
    try {
      await this.dependencies.leaderboards.upsertBest(entries.score);
      if (entries.clear) await this.dependencies.leaderboards.upsertBest(entries.clear);
      const save = await this.dependencies.saves.get(receipt.userId);
      if (save?.runId === receipt.runId) await this.dependencies.saves.delete(receipt.userId, save.revision);
    } catch (error) {
      console.error(JSON.stringify({ event: 'run-projection-failed', runId: receipt.runId, correlationId }));
      if (error instanceof StorageError) throw error;
      throw new StorageError('STORAGE_UNAVAILABLE');
    }

    return {
      runId: receipt.runId,
      score: receipt.score,
      goldAward: receipt.goldAward,
      unlockedCharacters: profile.unlockedCharacters,
      profile,
      scoreBoardUpdated: true,
      clearBoardUpdated: Boolean(entries.clear),
      replayed,
    };
  }
}

function unlockCharacters(profile: PlayerProfile, submission: RunSubmission, goldAward: number): CharacterId[] {
  const unlocked = new Set<CharacterId>(profile.unlockedCharacters);
  unlocked.add('archer');
  if (submission.status === 'won') unlocked.add('mage');
  if (profile.lifetimeGoldEarned + goldAward >= merchantUnlockGold) unlocked.add('merchant');
  return [...unlocked];
}

function createLeaderboardEntries(
  caller: Caller,
  displayName: string,
  receipt: RunReceiptDocument,
): { score: LeaderboardEntry; clear?: LeaderboardEntry } {
  const userId = userIdFor(caller);
  const tier = karmaTier(receipt.karma);
  const base = {
    id: userId,
    userId,
    displayName,
    score: receipt.score,
    kills: receipt.kills,
    characterId: receipt.characterId,
    karmaTier: tier,
    elapsedSeconds: receipt.elapsedSeconds,
    clear: receipt.status === 'won',
    updatedAt: receipt.createdAt,
  };
  const score = LeaderboardEntrySchema.parse({ ...base, boardId: 'score' });
  const clear = receipt.status === 'won'
    ? LeaderboardEntrySchema.parse({ ...base, boardId: `clear:${receipt.characterId}:${tier}` })
    : undefined;
  return { score, clear };
}
