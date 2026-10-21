import { describe, expect, it } from 'vitest';
import type { LeaderboardEntry } from '@caravan/contracts';
import { LeaderboardService } from '../../src/services/leaderboardService.js';

const caller = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  objectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  displayName: 'Player 12',
};
const userId = `${caller.tenantId}:${caller.objectId}`;

function entry(rank: number, isCaller = false): LeaderboardEntry {
  const id = isCaller ? userId : `cccccccc-cccc-cccc-cccc-${String(rank).padStart(12, '0')}:dddddddd-dddd-dddd-dddd-dddddddddddd`;
  return {
    id, userId: id, boardId: 'score', displayName: isCaller ? caller.displayName : `Player ${rank}`,
    score: 1000 - rank, kills: 100 - rank, characterId: 'hero', karmaTier: 'neutral',
    elapsedSeconds: 900 - rank, clear: false, updatedAt: '2026-10-21T00:00:00.000Z',
  };
}

describe('leaderboard pages', () => {
  it('returns ten public rows and computes the caller rank beyond the visible page', async () => {
    const all = Array.from({ length: 12 }, (_, index) => entry(index + 1, index === 11));
    const service = new LeaderboardService({
      listTop: async (_boardId, limit = 10) => all.slice(0, limit),
      listAll: async () => all,
      upsertBest: async () => undefined,
    });

    const page = await service.scoreBoard(caller, 10);
    expect(page.entries).toHaveLength(10);
    expect(page.myRank).toBe(12);
    expect(page.entries[0]).toMatchObject({ rank: 1, displayName: 'Player 1' });
    expect(page.entries[0]).not.toHaveProperty('userId');
    expect(page.entries[0]).not.toHaveProperty('id');
  });

  it('validates clear-board filters and leaves rank null when the player has no record', async () => {
    const service = new LeaderboardService({
      listTop: async () => [],
      listAll: async () => [],
      upsertBest: async () => undefined,
    });
    await expect(service.clearBoard(caller, 'unknown', 'good', 10)).rejects.toMatchObject({
      code: 'INVALID_LEADERBOARD_FILTER',
    });
    await expect(service.clearBoard(caller, 'hero', 'good', 10)).resolves.toEqual({ entries: [], myRank: null });
    await expect(service.scoreBoard(caller, 11)).rejects.toMatchObject({ code: 'INVALID_LEADERBOARD_FILTER' });
  });
});
