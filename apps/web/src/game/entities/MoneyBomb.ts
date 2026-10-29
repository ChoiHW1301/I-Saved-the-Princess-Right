import Phaser from 'phaser';

export interface MoneyBombState { id: string; x: number; y: number; remainingMs: number; damage: number; radius: number }

export class MoneyBomb extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, readonly bomb: MoneyBombState) {
    super(scene, bomb.x, bomb.y);
    const shadow = scene.add.ellipse(1, 12, 25, 8, 0x130d0a, 0.45);
    const shell = scene.add.graphics();
    shell.fillStyle(0x35231c).fillRect(-10, -7, 20, 17).fillRect(-7, -10, 14, 23);
    shell.fillStyle(0x8a4e22).fillRect(-7, -9, 14, 18);
    shell.fillStyle(0xc57928).fillRect(-4, -6, 8, 13);
    shell.fillStyle(0x37251c).fillRect(-3, -15, 6, 7);
    shell.fillStyle(0xdcb345).fillRect(-1, -18, 3, 4).fillRect(3, -20, 3, 3);
    shell.fillStyle(0xffe17b).fillRect(5, -23, 3, 3).fillRect(1, -25, 2, 2);
    shell.fillStyle(0x2a1d16).fillRect(-3, -2, 2, 2).fillRect(2, -2, 2, 2);
    this.add([shadow, shell]);
    this.setDepth(9);
    scene.add.existing(this);
  }

  advance(deltaMs: number): boolean {
    this.bomb.remainingMs = Math.max(0, this.bomb.remainingMs - Math.max(0, deltaMs));
    if (this.bomb.remainingMs <= 900) {
      const pulse = 1 + Math.sin((900 - this.bomb.remainingMs) / 55) * 0.09;
      this.setScale(pulse);
    }
    return this.bomb.remainingMs > 0;
  }
}
