import { useEffect, useRef, type JSX } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from './config/createGameConfig.js';

export function GameCanvas(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
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
  return <div ref={hostRef} aria-label="마차 호위 게임 화면" style={{ width: '100%', height: '100%' }} />;
}
