import { describe, expect, it, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';
import { whoami } from '../../src/functions/whoami.js';
import { getProfile } from '../../src/functions/profile.js';
import { getSave } from '../../src/functions/save.js';
import { getScoreBoard, getClearBoard } from '../../src/functions/leaderboards.js';
import { postRun } from '../../src/functions/runs.js';

vi.stubEnv('ENTRA_TENANT_ID', '11111111-1111-4111-8111-111111111111');
vi.stubEnv('ENTRA_API_AUDIENCE', 'api://33333333-3333-4333-8333-333333333333');
vi.stubEnv('COSMOS_ENDPOINT', 'https://example.documents.azure.com:443/');

function request(path: string, method = 'GET'): HttpRequest {
  return new HttpRequest({ url: `https://game.example.com/api/${path}`, method });
}

describe('release authorization boundary', () => {
  it.each([
    ['identity', () => whoami(request('me'))],
    ['profile', () => getProfile(request('profile'), {} as never)],
    ['save', () => getSave(request('save'), {} as never)],
    ['score leaderboard', () => getScoreBoard(request('leaderboards/score'), {} as never)],
    ['clear leaderboard', () => getClearBoard(request('leaderboards/clears'), {} as never)],
    ['run submission', () => postRun(request('runs', 'POST'), {} as never)],
  ])('rejects unauthenticated %s access with 401', async (_name, invoke) => {
    const response = await invoke();
    expect(response.status).toBe(401);
    expect(response.jsonBody).toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
