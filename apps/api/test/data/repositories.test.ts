import { describe, expect, it, vi } from 'vitest';
import type { ContainerPort } from '../../src/data/repositorySupport.js';
import { ProfileRepository } from '../../src/data/profileRepository.js';
import { SaveRepository } from '../../src/data/saveRepository.js';
import { LeaderboardRepository } from '../../src/data/leaderboardRepository.js';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const caller = { tenantId: userId.split(':')[0]!, objectId: userId.split(':')[1]!, displayName: 'Hero' };
const now = '2026-10-21T00:00:00.000Z';
const snapshot = {
  elapsedSeconds: 10, stageId: 'castle', rngSeed: 42, karma: 0, status: 'active', pendingEventId: null,
  eventChoiceIds: [], ordinarySpawnCooldownMs: 800, activeBoss: null,
  player: { x: 0, y: 0, hp: 100, level: 1, xp: 0, respawnMs: 0, invulnerableMs: 0 },
  wagon: { hp: 100, maxHp: 100 }, runGold: 0, weaponLevels: { sword: 1 }, upgradeIds: [],
  defeatedBossIds: [], enemies: [], projectiles: [],
};

function mockedContainer(): {
  container: ContainerPort;
  documents: Map<string, any>;
  item: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  batch: ReturnType<typeof vi.fn>;
  execute: ReturnType<typeof vi.fn>;
} {
  const documents = new Map<string, any>();
  const item = vi.fn((id: string, partition: string) => ({
    read: vi.fn(async () => {
      const resource = documents.get(`${partition}/${id}`);
      if (!resource) throw { statusCode: 404 };
      return { resource, etag: 'etag-1' };
    }),
    replace: vi.fn(async (resource: any) => {
      documents.set(`${partition}/${id}`, resource);
      return { resource, etag: 'etag-2' };
    }),
    delete: vi.fn(async () => { documents.delete(`${partition}/${id}`); }),
  }));
  const create = vi.fn(async (document: any) => {
    documents.set(`${document.userId}/${document.id}`, document);
    return { resource: document };
  });
  const upsert = vi.fn(async (document: any) => ({ resource: document }));
  const execute = vi.fn(async () => ({ statusCode: 200 }));
  const batch = vi.fn(() => ({ create: vi.fn().mockReturnThis(), replace: vi.fn().mockReturnThis(), execute }));
  const container = {
    item,
    items: {
      create,
      upsert,
      query: vi.fn(() => ({ fetchAll: vi.fn(async () => ({ resources: [] })) })),
      batch,
    },
  } as unknown as ContainerPort;
  return { container, documents, item, create, upsert, batch, execute };
}

describe('Cosmos repositories', () => {
  it('creates a profile in the user partition and returns a default hero profile', async () => {
    const mock = mockedContainer();
    const repository = new ProfileRepository(mock.container);
    const profile = await repository.getOrCreate(caller);
    expect(profile.unlockedCharacters).toEqual(['hero']);
    expect(mock.item).toHaveBeenCalledWith('profile', userId);
    expect(mock.create).toHaveBeenCalledOnce();
  });

  it('applies a run receipt and profile update in one user-partition batch', async () => {
    const mock = mockedContainer();
    mock.documents.set(`${userId}/profile`, {
      id: 'profile', userId, tenantId: caller.tenantId, objectId: caller.objectId, version: 1,
      displayName: caller.displayName, goldBalance: 0, lifetimeGoldEarned: 0, unlockedCharacters: ['hero'],
      permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
    });
    const repository = new ProfileRepository(mock.container);
    const receipt = {
      id: 'run:run-1', userId, runId: 'run-1', score: 100, goldAward: 10,
      status: 'won' as const, endingId: 'princess-purified' as const, characterId: 'hero' as const,
      elapsedSeconds: 120, kills: 1, defeatedBossIds: ['castle-warlord', 'princess-demon'], karma: 50, createdAt: now,
    };
    const updated = {
      id: 'profile' as const, userId, tenantId: caller.tenantId, objectId: caller.objectId, version: 2,
      displayName: caller.displayName, goldBalance: 10, lifetimeGoldEarned: 10, unlockedCharacters: ['hero'] as ['hero'],
      permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
    };
    await expect(repository.applyRunOnce(caller, receipt, updated)).resolves.toBe(true);
    expect(mock.batch).toHaveBeenCalledWith(userId);
    expect(mock.execute).toHaveBeenCalledOnce();
  });

  it('increments save revisions and turns stale revision writes into SAVE_CONFLICT', async () => {
    const mock = mockedContainer();
    const repository = new SaveRepository(mock.container);
    const save = { id: 'current', userId, schemaVersion: 1, revision: 0, runId: 'run-1', savedAt: now, snapshot } as const;
    const first = await repository.put(save, null);
    expect(first.revision).toBe(1);
    await expect(repository.put(save, 0)).rejects.toMatchObject({ code: 'SAVE_CONFLICT' });
  });

  it('does not overwrite a better leaderboard entry and queries the requested board in rank order', async () => {
    const query = vi.fn(() => ({ fetchAll: vi.fn(async () => ({ resources: [] })) }));
    const mock = mockedContainer();
    (mock.container.items as any).query = query;
    mock.documents.set(`score/${userId}`, {
      id: userId, boardId: 'score', userId, displayName: 'Hero', score: 200,
      kills: 2, characterId: 'hero', karmaTier: 'good', elapsedSeconds: 30, clear: true, updatedAt: now,
    });
    const repository = new LeaderboardRepository(mock.container);
    await repository.upsertBest({
      id: userId, boardId: 'score', userId, displayName: 'Hero', score: 100,
      kills: 1, characterId: 'hero', karmaTier: 'good', elapsedSeconds: 30, clear: true, updatedAt: now,
    });
    expect(mock.upsert).not.toHaveBeenCalled();
    await repository.listTop('score', 10);
    expect(query).toHaveBeenCalledWith(expect.objectContaining({
      query: expect.stringContaining('ORDER BY c.score DESC, c.kills DESC, c.elapsedSeconds DESC, c.displayName ASC'),
    }), { partitionKey: 'score' });
  });
});
