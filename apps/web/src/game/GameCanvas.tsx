import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/createGameConfig.js';
import type { BossId, RunEndingSummary, UpgradeChoice } from '@caravan/contracts';
import type { CharacterId, PlayerProfile } from '@caravan/contracts';
import type { CurrentRunSaveV1, RunReceipt, RunSubmission } from '@caravan/contracts';
import { WORLD_HEIGHT, WORLD_WIDTH } from './config/createGameConfig.js';
import type { StoryEvent } from './content/events.js';
import type { CampaignMilestone } from './content/campaignSchedule.js';
import { gameEventBus } from './bridge/GameEventBus.js';
import { LevelUpOverlay } from './ui/LevelUpOverlay.js';
import { EventChoiceOverlay } from './ui/EventChoiceOverlay.js';
import { ResultPage } from '../features/results/ResultPage.js';
import { RunController, RunControllerError } from '../features/run/RunController.js';

type ActiveBossEncounter = CampaignMilestone & { bossId: BossId };

export function GameCanvas({ characterId = 'warrior', profile, runId, resumeSave, controller, onExit, onProfileUpdated, onSaved }: {
  characterId?: CharacterId; profile?: PlayerProfile; runId?: string; resumeSave?: CurrentRunSaveV1; controller: RunController;
  onExit(): void; onProfileUpdated(profile: PlayerProfile): void; onSaved?(): void;
}): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; choices: UpgradeChoice[] } | null>(null);
  const [storyEvent, setStoryEvent] = useState<StoryEvent | null>(null);
  const [bossEncounter, setBossEncounter] = useState<ActiveBossEncounter | null>(null);
  const [runSummary, setRunSummary] = useState<RunEndingSummary | null>(null);
  const [runReceipt, setRunReceipt] = useState<RunReceipt | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pauseMenu, setPauseMenu] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [miniBossWarning, setMiniBossWarning] = useState(false);
  const [saving, setSaving] = useState(false);
  const chooseUpgrade = useCallback((upgradeId: string): void => {
    gameEventBus.emit('upgrade-choice', { upgradeId });
  }, []);
  const chooseEvent = useCallback((eventId: string, choiceId: 'yes' | 'no'): void => {
    gameEventBus.emit('event-choice', { eventId, choiceId });
  }, []);

  useEffect(() => {
    const unsubscribeLevelUp = gameEventBus.on('level-up', setLevelUp);
    const unsubscribeComplete = gameEventBus.on('level-up-complete', () => setLevelUp(null));
    const unsubscribeEvent = gameEventBus.on('story-event', setStoryEvent);
    const unsubscribeEventComplete = gameEventBus.on('event-complete', () => setStoryEvent(null));
    const unsubscribeBoss = gameEventBus.on('boss-encounter', (encounter) => { setBossEncounter(encounter); setMiniBossWarning(false); });
    const unsubscribeWarning = gameEventBus.on('mini-boss-warning', () => setMiniBossWarning(true));
    const unsubscribeBossComplete = gameEventBus.on('boss-defeated', ({ milestoneId }) => {
      setBossEncounter((active) => active?.id === milestoneId ? null : active);
      setMiniBossWarning(false);
    });
    const unsubscribeRunEnded = gameEventBus.on('run-ended', (summary) => {
      setRunSummary(summary); setLevelUp(null); setStoryEvent(null); setBossEncounter(null); setSubmitting(true); setResultError(null);
      const submission: RunSubmission = { runId: summary.runId, characterId: summary.characterId, status: summary.status, elapsedSeconds: Math.floor(summary.elapsedSeconds), kills: summary.kills, defeatedBossIds: summary.defeatedBossIds, karma: summary.karma, endingId: summary.endingId };
      void controller.submitResult(submission).then((receipt) => { setRunReceipt(receipt); onProfileUpdated(receipt.profile); }).catch((error: unknown) => {
        setResultError(error instanceof RunControllerError ? error.message : '결과 제출에 실패했습니다. 다시 시도해 주세요.');
      }).finally(() => setSubmitting(false));
    });
    return () => { unsubscribeLevelUp(); unsubscribeComplete(); unsubscribeEvent(); unsubscribeEventComplete(); unsubscribeBoss(); unsubscribeWarning(); unsubscribeBossComplete(); unsubscribeRunEnded(); };
  }, [controller, onProfileUpdated]);

  useEffect(() => {
    const unsubscribeSnapshot = gameEventBus.on('snapshot-ready', (request) => {
      setSaving(true);
      void controller.saveSnapshot(request.runId, request.snapshot).then(() => {
        gameEventBus.emit('snapshot-saved', { reason: request.reason, resume: request.resumeAfterSave });
        setNetworkError(null); setPauseMenu(request.reason === 'manual'); onSaved?.();
        if (request.reason === 'manual') onExit();
      }).catch((error: unknown) => {
        const message = error instanceof RunControllerError ? error.message : '저장에 실패했습니다. 다시 시도해 주세요.';
        setNetworkError(message); gameEventBus.emit('snapshot-failed', { message });
      }).finally(() => setSaving(false));
    });
    return () => unsubscribeSnapshot();
  }, [controller, onExit, onSaved]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.dataset.gameMounted === 'true') return;
    host.dataset.gameMounted = 'true';
    const game = new Phaser.Game(createGameConfig(host, { width: WORLD_WIDTH, height: WORLD_HEIGHT, seed: Date.now(), characterId, profile, runId, resumeSave }));
    return () => {
      game.destroy(true);
      delete host.dataset.gameMounted;
    };
  }, [characterId, resumeSave, runId]);
  useEffect(() => {
    const timer = window.setInterval(() => gameEventBus.emit('snapshot-request', { reason: 'autosave' }), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  async function retrySubmission(): Promise<void> {
    setSubmitting(true); setResultError(null);
    try { const receipt = await controller.retryResult(); setRunReceipt(receipt); onProfileUpdated(receipt.profile); }
    catch (error) { setResultError(error instanceof RunControllerError ? error.message : '결과 재제출에 실패했습니다.'); }
    finally { setSubmitting(false); }
  }
  async function resumeNetworkRun(): Promise<void> {
    setSaving(true);
    try { await controller.resumeAfterSync(); setNetworkError(null); setPauseMenu(false); gameEventBus.emit('resume-run', null); }
    catch (error) { setNetworkError(error instanceof RunControllerError ? error.message : '동기화에 실패했습니다.'); }
    finally { setSaving(false); }
  }
  async function returnToServerSave(): Promise<void> {
    setSaving(true);
    try { await controller.discardLocalConflict(); onSaved?.(); onExit(); }
    catch (error) { setNetworkError(error instanceof RunControllerError ? error.message : '임시 저장을 정리하지 못했습니다.'); }
    finally { setSaving(false); }
  }
  return (
    <>
      <div ref={hostRef} aria-label="마차 호위 게임 화면" style={{ width: '100%', height: '100%' }} />
      {miniBossWarning && !bossEncounter && <div className="mini-boss-warning" role="status">Warning!! 수상한 기운이 접근합니다!</div>}
      <button type="button" className="game-pause-button" onClick={() => { setPauseMenu(true); gameEventBus.emit('pause-request', null); }} aria-label="일시 정지" />
      {levelUp && <LevelUpOverlay level={levelUp.level} choices={levelUp.choices} onChoose={chooseUpgrade} />}
      {storyEvent && <EventChoiceOverlay event={storyEvent} onChoose={chooseEvent} />}
      {bossEncounter && <div role="status" style={{ position: 'absolute', zIndex: 15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '10px 22px', border: '1px solid #b86556', borderRadius: 999, background: '#251414dd', color: '#f0c6a8', letterSpacing: '.12em', pointerEvents: 'none' }}>
        {bossEncounter.kind === 'final-boss' ? 'FINAL BOSS' : 'MINI-BOSS'} · {bossEncounter.bossId.replaceAll('-', ' ').toUpperCase()}
      </div>}
      {pauseMenu && !runSummary && <section className="run-dialog" role="dialog" aria-modal="true" aria-labelledby="pause-title"><div><span className="eyebrow">CARAVAN CAMP</span><h2 id="pause-title">원정 일시 정지</h2><p>진행 상황을 저장하고 야영지로 돌아갈 수 있습니다.</p><button type="button" className="button button-primary" disabled={saving} onClick={() => gameEventBus.emit('snapshot-request', { reason: 'manual' })}>{saving ? '저장 중…' : '저장하고 야영지로'}</button><button type="button" className="button button-secondary" onClick={() => { setPauseMenu(false); gameEventBus.emit('resume-run', null); }}>계속 플레이</button></div></section>}
      {networkError && !runSummary && <section className="run-dialog" role="alertdialog" aria-modal="true" aria-labelledby="network-title"><div><span className="eyebrow">SAVE SYNC</span><h2 id="network-title">게임을 멈췄습니다</h2><p>{networkError}</p><button type="button" className="button button-primary" disabled={saving} onClick={() => void resumeNetworkRun()}>{saving ? '동기화 중…' : '연결 확인 후 동기화'}</button>{controller.syncStatus === 'conflict' && <button type="button" className="button button-secondary" disabled={saving} onClick={() => void returnToServerSave()}>서버 저장을 사용하고 야영지로</button>}<button type="button" className="button button-secondary" disabled={saving} onClick={() => { if (controller.syncStatus !== 'clean') onSaved?.(); onExit(); }}>야영지로 돌아가기</button></div></section>}
      {runSummary && <ResultPage summary={runSummary} receipt={runReceipt} error={resultError} busy={submitting} onRetry={() => void retrySubmission()} onContinue={onExit} />}
    </>
  );
}
