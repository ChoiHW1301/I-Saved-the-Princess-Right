import { PlayerProfileSchema, type MetaUpgradeId, type PlayerProfile } from '@caravan/contracts';

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { code?: string };
    throw new ProfileApiError(response.status, body.code ?? 'REQUEST_FAILED');
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export class ProfileApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); this.name = 'ProfileApiError'; }
}

export async function getProfile(token: string): Promise<PlayerProfile> {
  return PlayerProfileSchema.parse(await request<unknown>('/profile', token));
}

export async function hasCurrentSave(token: string): Promise<boolean> {
  try {
    await request('/save', token);
    return true;
  } catch (error) {
    if (error instanceof ProfileApiError && error.status === 404) return false;
    throw error;
  }
}

export async function purchaseUpgrade(token: string, upgradeId: MetaUpgradeId, expectedProfileVersion: number): Promise<PlayerProfile> {
  return PlayerProfileSchema.parse(await request<unknown>('/profile/upgrades', token, {
    method: 'POST', body: JSON.stringify({ upgradeId, expectedProfileVersion }),
  }));
}

export async function purchasePassive(token: string, passiveId: string, expectedProfileVersion: number): Promise<PlayerProfile> {
  return PlayerProfileSchema.parse(await request<unknown>('/profile/passives', token, {
    method: 'POST', body: JSON.stringify({ upgradeId: passiveId, expectedProfileVersion }),
  }));
}
