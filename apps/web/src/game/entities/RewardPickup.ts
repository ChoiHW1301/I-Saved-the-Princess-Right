import Phaser from 'phaser';
import type { RewardPickupState } from '../systems/RewardPickupSystem.js';
import { pickupVisible, updatePickup } from '../systems/RewardPickupSystem.js';

const frames: Record<RewardPickupState['type'], number> = { gold: 12, experience: 13, 'player-health': 14, 'caravan-repair': 15 };

export class RewardPickup extends Phaser.GameObjects.Image {
  elapsedMs = 0;
  constructor(scene: Phaser.Scene, readonly pickup: RewardPickupState) {
    super(scene, pickup.x, pickup.y, 'ui-icons', frames[pickup.type]);
    pickup.lifetimeMs ??= 30_000;
    pickup.blinkDurationMs ??= 5_000;
    this.elapsedMs = Math.max(0, pickup.lifetimeMs - pickup.remainingMs);
    this.setDisplaySize(32, 32).setDepth(11);
    scene.add.existing(this);
    this.setVisible(pickupVisible(pickup.remainingMs, this.elapsedMs, pickup.blinkDurationMs));
  }
  advance(deltaMs: number): boolean {
    this.elapsedMs += deltaMs;
    const alive = updatePickup(this.pickup, deltaMs);
    this.setVisible(alive && pickupVisible(this.pickup.remainingMs, this.elapsedMs, this.pickup.blinkDurationMs));
    return alive;
  }
}
