import Phaser from 'phaser';
import { normalizedMovement, type MovementInput } from '../systems/MovementInput.js';

export class Hero extends Phaser.Physics.Arcade.Sprite {
  static readonly SPEED = 220;
  moveSpeed = Hero.SPEED;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    if (!scene.textures.exists('hero-art')) {
      const art = scene.add.graphics();
      art.fillStyle(0x15202a).fillRoundedRect(5, 19, 29, 29, 8);
      art.fillStyle(0x597e91).fillRoundedRect(7, 18, 25, 24, 7);
      art.fillStyle(0xd7b68e).fillCircle(19, 12, 11);
      art.fillStyle(0xd7d8cf).fillTriangle(18, 21, 40, 37, 35, 42);
      art.fillStyle(0xa5bbc5).fillTriangle(36, 34, 47, 42, 34, 40);
      art.generateTexture('hero-art', 52, 52);
      art.destroy();
    }
    super(scene, x, y, 'hero-art');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).setSize(25, 31).setOffset(7, 15);
  }
  setInput(input: MovementInput): void {
    const vector = normalizedMovement(input);
    (this.body as Phaser.Physics.Arcade.Body).setVelocity(vector.x * this.moveSpeed, vector.y * this.moveSpeed);
  }
}
