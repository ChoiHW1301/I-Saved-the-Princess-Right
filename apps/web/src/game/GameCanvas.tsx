import { useCallback, useEffect, useRef, useState, type JSX } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/createGameConfig.js';
import type { UpgradeChoice } from '@caravan/contracts';
import { gameEventBus } from './bridge/GameEventBus.js';
import { LevelUpOverlay } from './ui/LevelUpOverlay.js';

export function GameCanvas(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const [levelUp, setLevelUp] = useState<{ level: number; choices: UpgradeChoice[] } | null>(null);
  const chooseUpgrade = useCallback((upgradeId: string): void => {
    gameEventBus.emit('upgrade-choice', { upgradeId });
  }, []);

  useEffect(() => {
    const unsubscribeLevelUp = gameEventBus.on('level-up', setLevelUp);
    const unsubscribeComplete = gameEventBus.on('level-up-complete', () => setLevelUp(null));
    return () => { unsubscribeLevelUp(); unsubscribeComplete(); };
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
    </>
  );
}
