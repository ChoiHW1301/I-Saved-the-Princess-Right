import Phaser from 'phaser';
import type { EnemyDefinition, EnemyTarget } from '../content/enemies.js';
import type { Damageable, Vector2 } from '../systems/CombatSystem.js';

let nextEnemyId = 1;
export class Enemy extends Phaser.GameObjects.Container implements Damageable {
  readonly id = `enemy-${nextEnemyId++}`;
  hp: number;
  readonly maxHp: number;
  dead = false;
  attackCooldownMs = 0;
  target: EnemyTarget = 'hero';
  constructor(scene: Phaser.Scene, x: number, y: number, readonly definition: EnemyDefinition) {
    super(scene, x, y);
    this.hp = definition.maxHp;
    this.maxHp = definition.maxHp;
    const body = scene.add.circle(0, 0, definition.wagonPriority ? 12 : 15, definition.color).setStrokeStyle(3, 0x211b19);
    const eye = scene.add.circle(4, -3, 2, 0xffe3bd);
    this.add([body, eye]);
    this.setDepth(8);
    scene.add.existing(this);
  }
  get worldPosition(): Vector2 { return { x: this.x, y: this.y }; }
  damage(amount: number): void {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) this.dead = true;
  }
}
