import { describe, expect, it } from 'vitest';
import {
  CurrentRunSaveV1Schema,
  EndingIdSchema,
  LeaderboardEntrySchema,
  PlayerProfileSchema,
  RunReceiptDocumentSchema,
  RunSnapshotV1Schema,
  RunSubmissionSchema,
} from '../src/index.js';

const userId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const now = '2026-10-21T00:00:00.000Z';

const profile = {
  id: 'profile', userId, tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  objectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', version: 1, displayName: 'Warrior', goldBalance: 0,
  lifetimeGoldEarned: 0, unlockedCharacters: ['warrior'], permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
};

const snapshot = {
  characterId: 'warrior', elapsedSeconds: 10, stageId: 'castle', rngSeed: 42, karma: 0, status: 'active', pendingEventId: null,
  eventChoiceIds: [], ordinarySpawnCooldownMs: 800, activeBoss: null,
  player: { x: 0, y: 0, hp: 100, maxHp: 100, level: 1, xp: 0, xpToNext: 10, respawnMs: 0, invulnerableMs: 0 },
  wagon: { hp: 100, maxHp: 100 }, runGold: 0, kills: 0, pendingLevelUps: 0, pendingChoices: [], weaponLevels: { sword: 1 }, upgradeStats: {}, upgradeIds: [],
  defeatedBossIds: [], enemies: [], projectiles: [],
};

describe('shared document schemas', () => {
  it('normalizes legacy hero identifiers to the warrior naming', () => {
    expect(PlayerProfileSchema.parse({ ...profile, unlockedCharacters: ['hero', 'dark-hero'] }).unlockedCharacters).toEqual(['warrior', 'dark-warrior']);
    expect(EndingIdSchema.parse('hero-new-demon-king')).toBe('warrior-new-demon-king');
    expect(RunSnapshotV1Schema.parse({ ...snapshot, characterId: 'hero', upgradeStats: { 'hero-reflect': 3 }, upgradeIds: ['hero-reflect'] }))
      .toMatchObject({ characterId: 'warrior', upgradeStats: { 'warrior-reflect': 3 }, upgradeIds: ['warrior-reflect'] });
  });
  it('accepts a profile, version 1 save, receipt, and leaderboard entry', () => {
    expect(PlayerProfileSchema.parse(profile).userId).toBe(userId);
    expect(CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 1, revision: 1, runId: 'run-1', savedAt: now, snapshot,
    }).snapshot.status).toBe('active');
    expect(RunReceiptDocumentSchema.parse({
      id: 'run:run-1', userId, runId: 'run-1', score: 500, goldAward: 10,
      status: 'won', endingId: 'princess-purified', characterId: 'warrior', elapsedSeconds: 120,
      kills: 5, defeatedBossIds: ['castle-warlord'], karma: 50, createdAt: now,
    }).status).toBe('won');
    expect(LeaderboardEntrySchema.parse({
      id: userId, boardId: 'score', userId, displayName: 'Warrior', score: 500, kills: 5,
      characterId: 'warrior', karmaTier: 'good', elapsedSeconds: 120, clear: true, updatedAt: now,
    }).score).toBe(500);
  });

  it('fills rehydration defaults when loading an earlier version 1 snapshot', () => {
    const { characterId: _characterId, kills: _kills, pendingLevelUps: _pendingLevelUps, pendingChoices: _pendingChoices, upgradeStats: _upgradeStats, ...oldSnapshotFields } = snapshot;
    const { maxHp: _maxHp, xpToNext: _xpToNext, ...oldPlayer } = snapshot.player;
    const parsed = CurrentRunSaveV1Schema.parse({
      id: 'current', userId, schemaVersion: 1, revision: 1, runId: 'run-1', savedAt: now,
      snapshot: { ...oldSnapshotFields, player: oldPlayer },
    });
    expect(parsed.snapshot).toMatchObject({ characterId: 'warrior', worldWidth: 1280, roadCenterY: 267, approachingEvent: null, rewardPickups: [], kills: 0, pendingChoices: [], player: { maxHp: 100, xpToNext: 10 } });
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

  it('accepts known boss result IDs and rejects unknown boss IDs or out-of-range run stats', () => {
    const run = {
      runId: 'run-1', characterId: 'warrior', status: 'won', elapsedSeconds: 1200, kills: 10000,
      defeatedBossIds: ['castle-warlord', 'lava-behemoth', 'forest-warden', 'princess-demon'], karma: 100, endingId: 'princess-purified',
    };
    expect(RunSubmissionSchema.parse(run).defeatedBossIds).toHaveLength(4);
    expect(() => RunSubmissionSchema.parse({ ...run, defeatedBossIds: ['unknown-boss'] })).toThrow();
    expect(() => RunSubmissionSchema.parse({ ...run, kills: 10001 })).toThrow();
  });
});
