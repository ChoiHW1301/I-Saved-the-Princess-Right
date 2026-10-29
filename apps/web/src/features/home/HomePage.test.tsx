import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@caravan/contracts';
import { CharacterSelect } from '../characters/CharacterSelect.js';
import { MetaShop } from '../progression/MetaShop.js';
import { getProfile, purchaseUpgrade } from '../profile/profileApi.js';

const profile: PlayerProfile = {
  id: 'profile', userId: '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222', tenantId: '11111111-1111-4111-8111-111111111111', objectId: '22222222-2222-4222-8222-222222222222', version: 3, displayName: 'Choi',
  goldBalance: 100, lifetimeGoldEarned: 500, unlockedCharacters: ['warrior', 'archer'],
  permanentUpgradeLevels: { 'max-health': 5 }, passiveIds: [], characterTrainingLevels: {}, updatedAt: '2026-10-22T00:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('account home feature UI and API', () => {
  it('shows a centered character portrait with left and right carousel controls', () => {
    const html = renderToStaticMarkup(createElement(CharacterSelect, { profile, onStart: () => undefined }));
    expect(html).toContain('src="/game-assets/portrait-warrior.png"');
    expect(html).toContain('alt="전사 일러스트"');
    expect(html).toContain('aria-label="이전 캐릭터"');
    expect(html).toContain('aria-label="다음 캐릭터"');
    expect(html).toContain('전사');
    expect(html).not.toContain('마법사');
    expect(html).not.toContain('상인');
    expect(html).not.toContain('해금됩니다');
  });

  it('shows only the warrior before the archer has been unlocked', () => {
    const firstRunProfile = { ...profile, unlockedCharacters: ['warrior'] as PlayerProfile['unlockedCharacters'] };
    const html = renderToStaticMarkup(createElement(CharacterSelect, { profile: firstRunProfile, onStart: () => undefined }));
    expect(html).not.toContain('aria-label="이전 캐릭터"');
    expect(html).not.toContain('aria-label="다음 캐릭터"');
    expect(html).toContain('aria-label="전사 선택 후 출발"');
    expect(html).not.toContain('궁수');
    expect(html).not.toContain('해금됩니다');
  });

  it('shows shared upgrade caps and removes obsolete passive purchases', () => {
    const html = renderToStaticMarkup(createElement(MetaShop, { profile: { ...profile, goldBalance: 0 }, onPurchased: () => undefined, onBuyUpgrade: async () => undefined, onBuyTraining: async () => undefined }));
    expect(html).toContain('최대 레벨'); expect(html).toContain('골드 부족 · 100 G'); expect(html).not.toContain('강철 의지');
  });

  it('loads the verified profile and posts a version-checked purchase', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response(JSON.stringify(profile), { status: 200 })).mockResolvedValueOnce(new Response(JSON.stringify({ ...profile, version: 4, goldBalance: 0 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    expect(await getProfile('access-token')).toMatchObject({ displayName: 'Choi', goldBalance: 100 });
    expect(await purchaseUpgrade('access-token', 'max-health', 3)).toMatchObject({ version: 4, goldBalance: 0 });
    expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/profile/upgrades');
    expect(JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body))).toEqual({ upgradeId: 'max-health', expectedProfileVersion: 3 });
  });

  it('returns safe API error codes so the page can show retry and access states', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 'FORBIDDEN', message: 'private details' }), { status: 403 })));
    await expect(getProfile('access-token')).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' });
  });
});
