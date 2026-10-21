import { describe, expect, it } from 'vitest';
import {
  CurrentRunSaveV1Schema,
  LeaderboardEntrySchema,
  PlayerProfileSchema,
  RunReceiptDocumentSchema,
} from '../src/index.js';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const now = '2026-10-21T00:00:00.000Z';

const profile = {
  id: 'profile', userId, tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  objectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', version: 1, displayName: 'Hero', goldBalance: 0,
  unlockedCharacters: ['hero'], permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
};

const snapshot = {
  elapsedSeconds: 10, stageId: 'castle', rngSeed: 42, karma: 0, status: 'active', pendingEventId: null,
  eventChoiceIds: [], ordinarySpawnCooldownMs: 800, activeBoss: null,
  player: { x: 0, y: 0, hp: 100, level: 1, xp: 0, respawnMs: 0, invulnerableMs: 0 },
  wagon: { hp: 100, maxHp: 100 }, runGold: 0, weaponLevels: { sword: 1 }, upgradeIds: [],
  defeatedBossIds: [], enemies: [], projectiles: [],
};

describe('shared document schemas', () => {
  it('accepts a profile, version 1 save, receipt, and leaderboard entry', () => {
    expect(PlayerProfileSchema.parse(profile).userId).toBe(userId);
    expect(CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 1, revision: 1, runId: 'run-1', savedAt: now, snapshot,
    }).snapshot.status).toBe('active');
    expect(RunReceiptDocumentSchema.parse({
      id: 'run:run-1', userId, runId: 'run-1', score: 500, goldAward: 10,
      status: 'won', endingId: 'purified-princess', createdAt: now,
    }).status).toBe('won');
    expect(LeaderboardEntrySchema.parse({
      id: userId, boardId: 'score', userId, displayName: 'Hero', score: 500,
      characterId: 'hero', karmaTier: 'good', elapsedSeconds: 120, clear: true, updatedAt: now,
    }).score).toBe(500);
  });

  it('rejects unsupported versions, malformed IDs, invalid counters and Cosmos metadata', () => {
    expect(() => CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 2, revision: 1, runId: 'run-1', savedAt: now, snapshot,
    })).toThrow();
    expect(() => PlayerProfileSchema.parse({ ...profile, _etag: 'cosmos-etag' })).toThrow();
    expect(() => PlayerProfileSchema.parse({ ...profile, userId: 'bad-id' })).toThrow();
    expect(() => CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 1, revision: -1, runId: 'run-1', savedAt: now, snapshot,
    })).toThrow();
  });

  it('caps entity arrays and total payload size', () => {
    const tooManyEnemies = Array.from({ length: 501 }, (_, index) => ({
      id: `enemy-${index}`, typeId: 'imp', x: 0, y: 0, hp: 1, attackCooldownMs: 0,
    }));
    expect(() => CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 1, revision: 1, runId: 'run-1', savedAt: now,
      snapshot: { ...snapshot, enemies: tooManyEnemies },
    })).toThrow();
    expect(() => PlayerProfileSchema.parse({ ...profile, displayName: 'x'.repeat(1_048_600) })).toThrow();
  });
});
