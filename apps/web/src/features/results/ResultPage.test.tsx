import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RunEndingSummary, RunReceipt } from '@caravan/contracts';
import { ResultPage } from './ResultPage.js';

const summary: RunEndingSummary = { runId: 'run-1', status: 'lost', endingId: 'caravan-lost', karma: 0, karmaTier: 'neutral', elapsedSeconds: 72, kills: 8, runGold: 8, characterId: 'warrior', defeatedBossIds: [] };
describe('run result screen', () => {
  it('shows server receipt rewards and unlocks before returning home', () => {
    const receipt: RunReceipt = { runId: 'run-1', score: 320, goldAward: 18, unlockedCharacters: ['warrior', 'archer'], newlyUnlockedCharacters: ['archer'], profile: { id: 'profile', userId: '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222', tenantId: '11111111-1111-4111-8111-111111111111', objectId: '22222222-2222-4222-8222-222222222222', version: 2, displayName: 'Warrior', goldBalance: 18, lifetimeGoldEarned: 18, unlockedCharacters: ['warrior', 'archer'], permanentUpgradeLevels: {}, passiveIds: [], characterTrainingLevels: {}, updatedAt: '2026-10-22T00:00:00.000Z' }, scoreBoardUpdated: true, clearBoardUpdated: false, replayed: false };
    const html = renderToStaticMarkup(createElement(ResultPage, { summary, receipt, error: null, busy: false, onRetry: () => undefined, onContinue: () => undefined }));
    expect(html).toContain('320점'); expect(html).toContain('획득 골드 +18 G'); expect(html).toContain('새 캐릭터 해금: 궁수'); expect(html).not.toContain('새 캐릭터 해금: 전사'); expect(html).not.toContain('archer'); expect(html).toContain('야영지로 돌아가기');
  });
  it('omits unlock messaging when the run unlocks nothing', () => {
    const receipt: RunReceipt = { runId: 'run-1', score: 320, goldAward: 18, unlockedCharacters: ['warrior', 'archer'], newlyUnlockedCharacters: [], profile: { id: 'profile', userId: '11111111-1111-4111-8111-111111111111:22222222-2222-4222-8222-222222222222', tenantId: '11111111-1111-4111-8111-111111111111', objectId: '22222222-2222-4222-8222-222222222222', version: 2, displayName: 'Warrior', goldBalance: 18, lifetimeGoldEarned: 18, unlockedCharacters: ['warrior', 'archer'], permanentUpgradeLevels: {}, passiveIds: [], characterTrainingLevels: {}, updatedAt: '2026-10-22T00:00:00.000Z' }, scoreBoardUpdated: true, clearBoardUpdated: false, replayed: false };
    const html = renderToStaticMarkup(createElement(ResultPage, { summary, receipt, error: null, busy: false, onRetry: () => undefined, onContinue: () => undefined }));
    expect(html).not.toContain('해금 캐릭터');
    expect(html).not.toContain('새 캐릭터 해금');
  });
  it('keeps a failed submission pending and offers retry with an idempotent run id', () => {
    const html = renderToStaticMarkup(createElement(ResultPage, { summary, receipt: null, error: '연결을 확인해 주세요.', busy: false, onRetry: () => undefined, onContinue: () => undefined }));
    expect(html).toContain('결과 다시 제출'); expect(html).toContain('보상이 중복 지급되지 않습니다.'); expect(html).not.toContain('야영지로 돌아가기');
  });
});
