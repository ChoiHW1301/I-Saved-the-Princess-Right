import { describe, expect, it, vi } from 'vitest';
import type { PlayerProfile, RunReceiptDocument, RunSubmission } from '@caravan/contracts';
import { RunService, calculateGoldAward, calculateScore } from '../../src/services/runService.js';
import { StorageError } from '../../src/data/repositorySupport.js';

const caller = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  objectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  displayName: 'Verified Player',
};
const userId = `${caller.tenantId}:${caller.objectId}`;
const now = '2026-10-21T00:00:00.000Z';
const submission: RunSubmission = {
  runId: 'run-1', characterId: 'hero', status: 'won', elapsedSeconds: 180, kills: 10,
  defeatedBossIds: ['castle-warlord', 'princess-demon'], karma: 60, endingId: 'princess-purified',
};

function profile(): PlayerProfile {
  return {
    id: 'profile', userId, tenantId: caller.tenantId, objectId: caller.objectId, version: 1,
    displayName: caller.displayName, goldBalance: 0, lifetimeGoldEarned: 0,
    unlockedCharacters: ['hero'], permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
  };
}

describe('run rewards and idempotency', () => {
  it('calculates rewards on the server using configured weights', () => {
    expect(calculateScore(submission)).toBe(10 * 100 + 180 + 2 * 500 + 2000);
    expect(calculateGoldAward(submission)).toBe(10 + 15 + 50);
  });

  it('awards once, unlocks characters, and repairs leaderboard projections on retry', async () => {
    let current = profile();
    const receipts = new Map<string, RunReceiptDocument>();
    const profiles = {
      getOrCreate: vi.fn(async () => current),
      getRunReceipt: vi.fn(async (_userId: string, runId: string) => receipts.get(runId) ?? null),
      applyRunOnce: vi.fn(async (_caller: unknown, receipt: RunReceiptDocument, updated: PlayerProfile) => {
        if (receipts.has(receipt.runId)) return false;
        receipts.set(receipt.runId, receipt);
        current = updated;
        return true;
      }),
    } as any;
    const upsertBest = vi.fn(async () => undefined);
    const leaderboards = { upsertBest } as any;
    const saves = { get: vi.fn(async () => null), delete: vi.fn(async () => undefined) } as any;
    const service = new RunService({ profiles, leaderboards, saves });

    const first = await service.submitRun(caller, submission, 'corr-1');
    expect(first.replayed).toBe(false);
    expect(first.profile.goldBalance).toBe(75);
    expect(first.profile.lifetimeGoldEarned).toBe(75);
    expect(first.unlockedCharacters).toEqual(['hero', 'archer', 'mage']);
    expect(upsertBest).toHaveBeenCalledTimes(2);

    const second = await service.submitRun(caller, submission, 'corr-2');
    expect(second.replayed).toBe(true);
    expect(second.profile.goldBalance).toBe(75);
    expect(profiles.applyRunOnce).toHaveBeenCalledOnce();
    expect(upsertBest).toHaveBeenCalledTimes(4);

    await expect(service.submitRun(caller, { ...submission, kills: 11 }, 'corr-3'))
      .rejects.toMatchObject({ code: 'RUN_ID_CONFLICT' });
  });

  it('does not grant rewards if a receipt is already applied concurrently', async () => {
    let current = profile();
    const prior: RunReceiptDocument = {
      id: 'run:run-1', userId, runId: 'run-1', score: 4180, goldAward: 75, status: 'won',
      endingId: 'princess-purified', characterId: 'hero', elapsedSeconds: 180, kills: 10,
      defeatedBossIds: ['castle-warlord', 'princess-demon'], karma: 60, createdAt: now,
    };
    const profiles = {
      getOrCreate: vi.fn(async () => current),
      getRunReceipt: vi.fn(async () => prior),
      applyRunOnce: vi.fn(async () => false),
    } as any;
    current = { ...profile(), version: 2, goldBalance: 75, lifetimeGoldEarned: 75 };
    const service = new RunService({
      profiles,
      leaderboards: { upsertBest: vi.fn(async () => undefined) } as any,
      saves: { get: vi.fn(async () => null), delete: vi.fn(async () => undefined) } as any,
    });
    const result = await service.submitRun(caller, submission, 'corr');
    expect(result.profile.goldBalance).toBe(75);
    expect(profiles.applyRunOnce).not.toHaveBeenCalled();
  });
});
