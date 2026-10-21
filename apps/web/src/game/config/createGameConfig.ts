import Phaser from 'phaser';
import { CaravanScene } from '../scenes/CaravanScene.js';

export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 720;

export function createGameConfig(parent: HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO, parent, width: WORLD_WIDTH, height: WORLD_HEIGHT,
    backgroundColor: '#171b19', pixelArt: true, roundPixels: true,
    scene: [CaravanScene],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: WORLD_WIDTH, height: WORLD_HEIGHT },
    physics: { default: 'arcade', arcade: { debug: false } },
  };
}
