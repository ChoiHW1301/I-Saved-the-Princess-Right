import Phaser from 'phaser';
import type { CharacterId } from '@caravan/contracts';
import type { KarmaTier } from '@caravan/contracts';
import { normalizedMovement, type MovementInput, type MovementVector } from '../systems/MovementInput.js';

export class Warrior extends Phaser.Physics.Arcade.Sprite {
  static readonly SPEED = 220;
  moveSpeed = Warrior.SPEED;
  private readonly baseScaleX: number;
  private readonly baseScaleY: number;
  private walkBob = 0;
  private lastMovementDirection: MovementVector = { x: 1, y: 0 };
  constructor(scene: Phaser.Scene, x: number, y: number, characterId: CharacterId = 'warrior') {
    const textureKey = characterId === 'dark-warrior' ? 'portrait-warrior' : `portrait-${characterId}`;
    super(scene, x, y, scene.textures.exists(textureKey) ? textureKey : 'portrait-warrior');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(10).setDisplaySize(78, 70);
    this.baseScaleX = this.scaleX;
    this.baseScaleY = this.scaleY;
    this.setCollideWorldBounds(true);
    (this.body as Phaser.Physics.Arcade.Body).setSize(220, 300).setOffset(222, 250);
  }
  setInput(input: MovementInput): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;
    const vector = normalizedMovement(input);
    if (vector.x !== 0 || vector.y !== 0) this.lastMovementDirection = vector;
    body.setVelocity(vector.x * this.moveSpeed, vector.y * this.moveSpeed);
    if (Math.abs(vector.x) > 0.01) this.setFlipX(vector.x < 0);
  }
  getLastMovementDirection(): MovementVector { return { ...this.lastMovementDirection }; }
  setDashVelocity(direction: MovementVector, speed: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body) return;
    body.setVelocity(direction.x * speed, direction.y * speed);
    if (Math.abs(direction.x) > 0.01) this.setFlipX(direction.x < 0);
    this.setAngle(direction.y * 5);
  }
  setKarmaTier(tier: KarmaTier): void {
    this.setTint(tier === 'evil' ? 0xc18bfa : 0xffffff);
  }

  updateWalkMotion(time: number): void {
    const body = this.body as Phaser.Physics.Arcade.Body | undefined;
    if (!body || body.velocity.lengthSq() < 100) {
      this.setY(this.y - this.walkBob);
      this.walkBob = 0;
      this.setScale(this.baseScaleX, this.baseScaleY).setAngle(0);
      return;
    }
    const step = Math.sin(time / 78);
    const squash = Math.abs(step) * 0.035;
    const bob = Math.abs(step) * 2.2;
    this.setY(this.y + bob - this.walkBob);
    this.walkBob = bob;
    this.setScale(this.baseScaleX * (1 + squash), this.baseScaleY * (1 - squash));
    this.setAngle(step * 1.8);
  }
}
