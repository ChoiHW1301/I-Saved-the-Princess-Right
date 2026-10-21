import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';
import type { PlayerProfile } from '@caravan/contracts';

const caller = {
  tenantId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  objectId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  displayName: 'Verified Player',
};
vi.mock('../../src/auth/authorize.js', () => ({ authorizeRequest: vi.fn(async () => caller) }));

import { getProfile, purchaseUpgrade } from '../../src/functions/profile.js';
import { deleteSave, getSave, putSave } from '../../src/functions/save.js';

const userId = `${caller.tenantId}:${caller.objectId}`;
const now = '2026-10-21T00:00:00.000Z';
const profile: PlayerProfile = {
  id: 'profile', userId, tenantId: caller.tenantId, objectId: caller.objectId, version: 1,
  displayName: caller.displayName, goldBalance: 1000, lifetimeGoldEarned: 1000,
  unlockedCharacters: ['hero'], permanentUpgradeLevels: {}, passiveIds: [], updatedAt: now,
};
const snapshot = {
  elapsedSeconds: 10, stageId: 'castle', rngSeed: 42, karma: 0, status: 'active', pendingEventId: null,
  eventChoiceIds: [], ordinarySpawnCooldownMs: 800, activeBoss: null,
  player: { x: 0, y: 0, hp: 100, level: 1, xp: 0, respawnMs: 0, invulnerableMs: 0 },
  wagon: { hp: 100, maxHp: 100 }, runGold: 0, weaponLevels: { sword: 1 }, upgradeIds: [],
  defeatedBossIds: [], enemies: [], projectiles: [],
};

function request(method: string, url: string, body?: unknown, extraHeaders: Record<string, string> = {}): HttpRequest {
  return new HttpRequest({
    method,
    url,
    headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...extraHeaders },
    ...(body === undefined ? {} : { body: { string: JSON.stringify(body) } }),
  });
}

describe('profile and save handlers', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the authenticated profile and purchases an upgrade with profile version checks', async () => {
    const save = vi.fn(async () => undefined);
    const profiles = { getOrCreate: vi.fn(async () => profile), save } as any;
    const getResponse = await getProfile(request('GET', 'http://localhost/api/profile'), profiles);
    expect(getResponse.status).toBe(200);
    expect((getResponse.jsonBody as PlayerProfile).userId).toBe(userId);

    const response = await purchaseUpgrade(request('POST', 'http://localhost/api/profile/upgrades', {
      upgradeId: 'max-health', expectedProfileVersion: 1,
    }), profiles);
    expect(response.status).toBe(200);
    expect((response.jsonBody as PlayerProfile).goldBalance).toBe(900);
    expect((response.jsonBody as PlayerProfile).permanentUpgradeLevels['max-health']).toBe(1);
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ version: 2 }));
  });

  it('saves versioned run state and reports unsupported versions and absent saves', async () => {
    const repository = {
      get: vi.fn(async () => null),
      put: vi.fn(async (value: any) => ({ ...value, revision: 1 })),
      delete: vi.fn(async () => undefined),
    } as any;
    const put = await putSave(request('PUT', 'http://localhost/api/save', {
      schemaVersion: 1, runId: 'run-1', expectedRevision: null, snapshot,
    }), repository);
    expect(put.status).toBe(200);
    expect((put.jsonBody as { userId: string }).userId).toBe(userId);
    expect(repository.put).toHaveBeenCalledWith(expect.objectContaining({ id: 'current', userId }), null);

    const unsupported = await putSave(request('PUT', 'http://localhost/api/save', {
      schemaVersion: 2, runId: 'run-1', expectedRevision: null, snapshot,
    }), repository);
    expect(unsupported.status).toBe(400);
    expect(unsupported.jsonBody).toMatchObject({ code: 'SAVE_VERSION_UNSUPPORTED' });

    const missing = await getSave(request('GET', 'http://localhost/api/save'), repository);
    expect(missing.status).toBe(404);
    expect(missing.jsonBody).toMatchObject({ code: 'SAVE_NOT_FOUND' });
  });

  it('returns 204 when deleting the current account save', async () => {
    const repository = {
      get: vi.fn(async () => ({ id: 'current', userId, revision: 3 })),
      delete: vi.fn(async () => undefined),
    } as any;
    const response = await deleteSave(request('DELETE', 'http://localhost/api/save'), repository);
    expect(response.status).toBe(204);
    expect(repository.delete).toHaveBeenCalledWith(userId, 3);
  });

  it('rejects a save request larger than the Cosmos document limit', async () => {
    const response = await putSave(request(
      'PUT',
      'http://localhost/api/save',
      { data: 'x'.repeat(1_048_600) },
      { 'content-length': '1048600' },
    ), {} as any);
    expect(response.status).toBe(413);
    expect(response.jsonBody).toMatchObject({ code: 'SAVE_TOO_LARGE' });
  });
});
