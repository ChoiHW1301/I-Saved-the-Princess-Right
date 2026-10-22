import type { CharacterId, KarmaTier } from '@caravan/contracts';

export interface PublicLeaderboardEntry {
  rank: number;
  displayName: string;
  score: number;
  kills: number;
  characterId: CharacterId;
  karmaTier: KarmaTier;
  elapsedSeconds: number;
  clear: boolean;
  updatedAt: string;
}

export interface LeaderboardResponse {
  entries: PublicLeaderboardEntry[];
  myRank: number | null;
  totalEntries: number;
}

export class LeaderboardApiError extends Error {
  constructor(readonly status: number, readonly code: string) {
    super(code);
    this.name = 'LeaderboardApiError';
  }
}

async function request(path: string, token: string): Promise<LeaderboardResponse> {
  const response = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { code?: string };
    throw new LeaderboardApiError(response.status, body.code ?? 'REQUEST_FAILED');
  }
  const body = await response.json() as Omit<LeaderboardResponse, 'totalEntries'> & { totalEntries?: number };
  return { ...body, totalEntries: body.totalEntries ?? body.entries.length };
}

export function getScoreBoard(token: string): Promise<LeaderboardResponse> {
  return request('/leaderboards/score?limit=10', token);
}

export function getClearBoard(token: string, characterId: CharacterId, karmaTier: KarmaTier): Promise<LeaderboardResponse> {
  const query = new URLSearchParams({ characterId, karmaTier, limit: '10' });
  return request(`/leaderboards/clears?${query.toString()}`, token);
}
