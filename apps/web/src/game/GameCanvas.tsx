import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/createGameConfig.js';
import type { UpgradeChoice } from '@caravan/contracts';
import type { StoryEvent } from './content/events.js';
import type { CampaignMilestone } from './content/campaignSchedule.js';
import { gameEventBus } from './bridge/GameEventBus.js';
import { LevelUpOverlay } from './ui/LevelUpOverlay.js';
import { EventChoiceOverlay } from './ui/EventChoiceOverlay.js';

export function GameCanvas(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; choices: UpgradeChoice[] } | null>(null);
  const [storyEvent, setStoryEvent] = useState<StoryEvent | null>(null);
  const [bossEncounter, setBossEncounter] = useState<CampaignMilestone | null>(null);
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
    const unsubscribeBoss = gameEventBus.on('boss-encounter', setBossEncounter);
    const unsubscribeBossComplete = gameEventBus.on('boss-defeated', ({ milestoneId }) => {
      setBossEncounter((active) => active?.id === milestoneId ? null : active);
    });
    return () => { unsubscribeLevelUp(); unsubscribeComplete(); unsubscribeEvent(); unsubscribeEventComplete(); unsubscribeBoss(); unsubscribeBossComplete(); };
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || host.dataset.gameMounted === 'true') return;
    host.dataset.gameMounted = 'true';
    const game = new Phaser.Game(createGameConfig(host));
    return () => {
      game.destroy(true);
      delete host.dataset.gameMounted;
    };
  }, []);
  return (
    <>
      <div ref={hostRef} aria-label="마차 호위 게임 화면" style={{ width: '100%', height: '100%' }} />
      {levelUp && <LevelUpOverlay level={levelUp.level} choices={levelUp.choices} onChoose={chooseUpgrade} />}
      {storyEvent && <EventChoiceOverlay event={storyEvent} onChoose={chooseEvent} />}
      {bossEncounter && <div role="status" style={{ position: 'absolute', zIndex: 15, top: '50%', left: '50%', transform: 'translate(-50%, -50%)', padding: '10px 22px', border: '1px solid #b86556', borderRadius: 999, background: '#251414dd', color: '#f0c6a8', letterSpacing: '.12em', pointerEvents: 'none' }}>
        {bossEncounter.kind === 'final-boss' ? 'FINAL BOSS' : 'MINI-BOSS'} · {bossEncounter.id.replaceAll('-', ' ').toUpperCase()}
      </div>}
    </>
  );
}
