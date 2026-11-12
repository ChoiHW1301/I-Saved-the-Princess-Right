import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CurrentRunSaveV1, PlayerProfile, RunSnapshotV1, RunSubmission } from '@caravan/contracts';
import { RunController, RunControllerError } from './RunController.js';
import type { LocalSaveStore } from './localSaveStore.js';
import { createRunState } from '../../game/state/createRunState.js';
import { createSnapshot, restoreSnapshot } from '../../game/systems/SaveSnapshotSystem.js';

const userId = '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222';
const profile: PlayerProfile = { id: 'profile', userId, tenantId: userId.split(':')[0]!, objectId: userId.split(':')[1]!, version: 1, displayName: 'Warrior', goldBalance: 0, lifetimeGoldEarned: 0, unlockedCharacters: ['warrior'], permanentUpgradeLevels: {}, passiveIds: [], characterTrainingLevels: {}, updatedAt: '2026-10-22T00:00:00.000Z' };
const snapshot: RunSnapshotV1 = {
  characterId: 'warrior', worldWidth: 1280, roadCenterY: 267, elapsedSeconds: 30, stageId: 'demon-castle', rngSeed: 99, karma: 0, status: 'active', pendingEventId: null, approachingEvent: null, rewardPickups: [], moneyBombs: [], eventChoiceIds: [], ordinarySpawnCooldownMs: 500, activeBoss: null,
  player: { x: 320, y: 340, hp: 100, maxHp: 100, level: 1, xp: 0, xpToNext: 10, respawnMs: 0, respawnsRemaining: 0, invulnerableMs: 0 }, wagon: { hp: 250, maxHp: 250 }, runGold: 0, kills: 0, pendingLevelUps: 0, pendingChoices: [], weaponLevels: { sword: 1 }, upgradeStats: {}, trainingLevels: {}, activeAbilityCooldownMs: 0, dashRemainingMs: 0, dashDirection: { x: 1, y: 0 }, upgradeIds: [], defeatedBossIds: [], enemies: [], projectiles: [],
};
function save(runId = 'run-1', revision = 0, state = snapshot): CurrentRunSaveV1 { return { id: 'current', userId, schemaVersion: 1, revision, runId, savedAt: '2026-10-22T00:00:00.000Z', snapshot: state }; }
class MemoryStore implements LocalSaveStore {
  value: CurrentRunSaveV1 | null = null; result: RunSubmission | null = null;
  async get(): Promise<CurrentRunSaveV1 | null> { return this.value; }
  async put(value: CurrentRunSaveV1): Promise<void> { this.value = value; }
  async clear(): Promise<void> { this.value = null; }
  async getResult(): Promise<RunSubmission | null> { return this.result; }
  async putResult(value: RunSubmission, _userId: string): Promise<void> { this.result = value; }
  async clearResult(): Promise<void> { this.result = null; }
}
function response(body: unknown, status = 200): Response { return new Response(status === 204 ? null : JSON.stringify(body), { status }); }
afterEach(() => vi.unstubAllGlobals());

describe('run save, resume, and result flow', () => {
  it('captures and restores character, combat progress, pending choices, and deterministic random state', () => {
    const run = createRunState('archer');
    run.runId = 'run-restore'; run.elapsedSeconds = 180; run.level = 3; run.xp = 5; run.xpToNext = 27; run.karma = 42; run.kills = 19; run.runGold = 11;
    run.weaponLevels['arrow-damage'] = 2; run.selectedUpgradeIds = ['arrow-damage']; run.upgradeStats['bow-damage'] = 4;
    run.pendingLevelUps = 1; run.pendingChoices = [{ id: 'arrow-range', nextLevel: 1, value: 30 }];
    const snapshot = createSnapshot({ run, player: { x: 400, y: 300 }, rngSeed: 1234, ordinarySpawnCooldownMs: 600, enemies: [], worldWidth: 960, roadCenterY: 360,
      approachingEvent: { eventId: 'wounded-messenger', x: 830 },
      rewardPickups: [{ id: 'drop-1', type: 'caravan-repair', x: 500, y: 360, amount: 40, remainingMs: 12_000 }],
    });
    const restored = restoreSnapshot(save('run-restore', 1, snapshot));
    expect(restored).toMatchObject({ runId: 'run-restore', characterId: 'archer', elapsedSeconds: 180, level: 3, xp: 5, karma: 42, kills: 19, runGold: 11, pendingChoices: [{ id: 'arrow-range' }], equippedWeaponIds: ['bow'] });
    expect(snapshot).toMatchObject({ rngSeed: 1234, player: { x: 400, y: 300 }, ordinarySpawnCooldownMs: 600,
      approachingEvent: { eventId: 'wounded-messenger', x: 830 }, rewardPickups: [{ id: 'drop-1', remainingMs: 12_000 }],
    });
  });

  it('stores a failed autosave locally, pauses, then synchronizes with the server revision', async () => {
    const local = new MemoryStore();
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ code: 'STORAGE_UNAVAILABLE' }, 503)).mockResolvedValueOnce(response({ code: 'SAVE_NOT_FOUND' }, 404)).mockResolvedValueOnce(response(save('run-1', 1)));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new RunController(async () => 'token', profile, local);
    await expect(controller.saveSnapshot('run-1', snapshot)).rejects.toMatchObject({ kind: 'offline' });
    expect(local.value).toMatchObject({ runId: 'run-1', revision: 0, snapshot: { elapsedSeconds: 30 } });
    const synced = await controller.resumeAfterSync();
    expect(synced.revision).toBe(1); expect(local.value).toBeNull(); expect(controller.syncStatus).toBe('clean');
    expect(JSON.parse(String(fetchMock.mock.calls[2]?.[1]?.body))).toMatchObject({ expectedRevision: null, snapshot: { elapsedSeconds: 30 } });
  });

  it('keeps the server save when another run conflicts with the local pending snapshot', async () => {
    const local = new MemoryStore(); local.value = save('local-run', 1);
    const fetchMock = vi.fn().mockResolvedValue(response(save('server-run', 1)));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new RunController(async () => 'token', profile, local);
    await expect(controller.continueRun()).rejects.toMatchObject({ kind: 'conflict' });
    expect(controller.syncStatus).toBe('conflict'); expect(fetchMock).toHaveBeenCalledTimes(1); expect(local.value?.runId).toBe('local-run');
  });

  it('retries the same pending result after an API failure', async () => {
    const local = new MemoryStore();
    const result: RunSubmission = { runId: 'run-1', characterId: 'warrior', status: 'lost', elapsedSeconds: 45, kills: 2, defeatedBossIds: [], karma: 0, endingId: 'caravan-lost' };
    const receipt = { runId: 'run-1', score: 80, goldAward: 3, unlockedCharacters: ['warrior', 'archer'], newlyUnlockedCharacters: ['archer'], profile: { ...profile, version: 2, goldBalance: 3, lifetimeGoldEarned: 3, unlockedCharacters: ['warrior', 'archer'] }, scoreBoardUpdated: true, clearBoardUpdated: false, replayed: false };
    const fetchMock = vi.fn().mockResolvedValueOnce(response({ code: 'STORAGE_UNAVAILABLE' }, 503)).mockResolvedValueOnce(response(receipt, 201));
    vi.stubGlobal('fetch', fetchMock);
    const controller = new RunController(async () => 'token', profile, local);
    await expect(controller.submitResult(result)).rejects.toMatchObject({ kind: 'offline' });
    expect(local.result?.runId).toBe(result.runId);
    await expect(controller.retryResult()).resolves.toMatchObject({ goldAward: 3, profile: { goldBalance: 3 } });
    expect(JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)).runId).toBe(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)).runId);
    expect(local.result).toBeNull();
  });
});
