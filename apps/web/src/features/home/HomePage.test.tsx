import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PlayerProfile } from '@caravan/contracts';
import { CharacterSelect } from '../characters/CharacterSelect.js';
import { MetaShop } from '../progression/MetaShop.js';
import { getProfile, purchaseUpgrade } from '../profile/profileApi.js';

const profile: PlayerProfile = {
  id: 'profile', userId: '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222', tenantId: '11111111-1111-4111-8111-111111111111', objectId: '22222222-2222-4222-8222-222222222222', version: 3, displayName: 'Choi',
  goldBalance: 100, lifetimeGoldEarned: 500, unlockedCharacters: ['hero', 'archer'],
  permanentUpgradeLevels: { 'max-health': 5 }, passiveIds: [], updatedAt: '2026-10-22T00:00:00.000Z',
};

afterEach(() => vi.unstubAllGlobals());

describe('account home feature UI and API', () => {
  it('shows unlocked and locked characters with reasons and disables locked starts', () => {
    const html = renderToStaticMarkup(createElement(CharacterSelect, { profile, onStart: () => undefined }));
    expect(html).toContain('용사'); expect(html).toContain('궁수'); expect(html).toContain('첫 클리어 후 해금됩니다.');
    expect(html).toContain('aria-label="마법사 잠김"');
    expect(html).toContain('disabled=""');
  });

  it('shows upgrade caps and disables unaffordable upgrades and passives', () => {
    const html = renderToStaticMarkup(createElement(MetaShop, { profile, onPurchased: () => undefined, onBuyUpgrade: async () => undefined, onBuyPassive: async () => undefined }));
    expect(html).toContain('최대 레벨'); expect(html).toContain('골드 부족 · 150 G'); expect(html).toContain('골드 부족 · 300 G');
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
