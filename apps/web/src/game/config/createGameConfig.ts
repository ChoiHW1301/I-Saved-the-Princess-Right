import Phaser from 'phaser';
import { CaravanScene } from '../scenes/CaravanScene.js';
import type { RunWorldConfig } from '../scenes/CaravanScene.js';

export const VIEW_WIDTH = 960;
export const VIEW_HEIGHT = 720;
export const WORLD_DISPLAY_SCALE = 0.75;
export const WORLD_WIDTH = VIEW_WIDTH / WORLD_DISPLAY_SCALE;
export const WORLD_HEIGHT = VIEW_HEIGHT / WORLD_DISPLAY_SCALE;
export const ROAD_CENTER_Y = WORLD_HEIGHT / 2;

export function createGameConfig(parent: HTMLElement, runConfig?: RunWorldConfig): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO, parent, width: VIEW_WIDTH, height: VIEW_HEIGHT,
    backgroundColor: '#171b19', pixelArt: true, roundPixels: true,
    scene: [new CaravanScene(runConfig)],
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: VIEW_WIDTH, height: VIEW_HEIGHT },
    physics: { default: 'arcade', arcade: { debug: false } },
  };
}
