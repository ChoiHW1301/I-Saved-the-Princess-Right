import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ClearBoard } from './ClearBoard.js';
import { ScoreBoard } from './ScoreBoard.js';
import { getClearBoard, getScoreBoard, type LeaderboardResponse } from './leaderboardApi.js';

const entry = (rank: number) => ({ rank, displayName: `Warrior ${rank}`, score: 1200 - rank, kills: 42, characterId: 'warrior' as const, karmaTier: 'good' as const, elapsedSeconds: 185, clear: true, updatedAt: '2026-10-22T00:00:00.000Z' });
const board: LeaderboardResponse = { entries: Array.from({ length: 12 }, (_, index) => entry(index + 1)), myRank: 12, totalEntries: 43 };

afterEach(() => vi.unstubAllGlobals());

describe('leaderboard screens and API', () => {
  it('renders only the top ten while showing the signed-in player’s rank separately', () => {
    const html = renderToStaticMarkup(createElement(ScoreBoard, { data: board }));
    expect(html).toContain('내 순위: 12위');
    expect(html).toContain('전체 기록 43건');
    expect(html).toContain('Warrior 10');
    expect(html).not.toContain('Warrior 11');
    expect(html).not.toContain('Warrior 12');
    expect(html).not.toContain('userId');
  });

  it('shows clear-board character and karma filters, and preserves cached entries on retryable errors', () => {
    const html = renderToStaticMarkup(createElement(ClearBoard, {
      data: board, characterId: 'mage', karmaTier: 'evil', onCharacterChange: () => undefined, onKarmaChange: () => undefined,
      error: '연결 상태를 확인한 뒤 다시 시도해 주세요.', onRetry: () => undefined,
    }));
    expect(html).toContain('value="mage"');
    expect(html).toContain('value="evil"');
    expect(html).toContain('다시 시도');
    expect(html).toContain('Warrior 1');
    expect(html).toContain('랭킹을 불러오지 못했습니다.');
  });

  it('requests both board modes with the selected clear filters and top-ten limit', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify({ entries: [], myRank: null, totalEntries: 0 }), { status: 200 })));
    vi.stubGlobal('fetch', fetchMock);
    await getScoreBoard('token');
    await getClearBoard('token', 'mage', 'evil');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/leaderboards/score?limit=10');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/leaderboards/clears?characterId=mage&karmaTier=evil&limit=10');
    expect(fetchMock.mock.calls[1]?.[1]?.headers).toEqual({ Authorization: 'Bearer token' });
  });

  it('falls back to the available public list count and maps forbidden responses safely', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ entries: [entry(1)], myRank: 14 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'private details' }), { status: 403 })));
    await expect(getScoreBoard('token')).resolves.toMatchObject({ totalEntries: 1 });
    await expect(getScoreBoard('token')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
