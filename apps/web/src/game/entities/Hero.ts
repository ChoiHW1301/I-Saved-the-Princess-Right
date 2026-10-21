import Phaser from 'phaser';
import type { KarmaTier } from '@caravan/contracts';
import { normalizedMovement, type MovementInput } from '../systems/MovementInput.js';

export class Hero extends Phaser.Physics.Arcade.Sprite {
  static readonly SPEED = 220;
  moveSpeed = Hero.SPEED;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    Hero.createArt(scene, 'hero-art', false);
    Hero.createArt(scene, 'hero-art-evil', true);
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
  setKarmaTier(tier: KarmaTier): void { this.setTexture(tier === 'evil' ? 'hero-art-evil' : 'hero-art'); }

  private static createArt(scene: Phaser.Scene, key: string, evil: boolean): void {
    if (scene.textures.exists(key)) return;
    const art = scene.add.graphics();
    art.fillStyle(evil ? 0x100d18 : 0x15202a).fillRoundedRect(5, 19, 29, 29, 8);
    art.fillStyle(evil ? 0x542c70 : 0x597e91).fillRoundedRect(7, 18, 25, 24, 7);
    art.fillStyle(evil ? 0xc5a4d7 : 0xd7b68e).fillCircle(19, 12, 11);
    art.fillStyle(evil ? 0x21142d : 0xd7d8cf).fillTriangle(18, 21, 40, 37, 35, 42);
    art.fillStyle(evil ? 0x9c62c2 : 0xa5bbc5).fillTriangle(36, 34, 47, 42, 34, 40);
    if (evil) art.fillStyle(0xd66aff).fillCircle(15, 12, 2).fillCircle(23, 12, 2);
    art.generateTexture(key, 52, 52);
    art.destroy();
  }
}
