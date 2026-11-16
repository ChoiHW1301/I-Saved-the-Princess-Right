import Phaser from 'phaser';
import { type DamageResult, type Vector2, type WeaponAttackTarget } from '../systems/CombatSystem.js';
import { advanceLavaSigil, applyLavaSigilHit, LAVA_SIGIL_FUSE_MS, LAVA_SIGIL_MAX_HP } from '../systems/LavaSigilSystem.js';

export interface LavaSigilState {
  id: string;
  x: number;
  y: number;
  hp: number;
  remainingMs: number;
}

export class LavaSigil extends Phaser.GameObjects.Container implements WeaponAttackTarget {
  readonly id: string;
  readonly maxHp = LAVA_SIGIL_MAX_HP;
  readonly hitRadius = 22;
  hp: number;
  dead = false;
  remainingMs: number;
  private elapsedMs: number;
  private readonly hpIndicators: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, readonly sigilId: string, x: number, y: number, hp = LAVA_SIGIL_MAX_HP, remainingMs = LAVA_SIGIL_FUSE_MS) {
    super(scene, x, y);
    this.id = sigilId;
    this.name = sigilId;
    this.hp = Phaser.Math.Clamp(Math.floor(hp), 1, this.maxHp);
    this.remainingMs = Phaser.Math.Clamp(remainingMs, 1, LAVA_SIGIL_FUSE_MS);
    this.elapsedMs = LAVA_SIGIL_FUSE_MS - this.remainingMs;

    const art = scene.add.graphics();
    art.fillStyle(0x4a1424, 0.74).fillCircle(0, 0, this.hitRadius);
    art.lineStyle(3, 0xff643e, 0.95).strokeCircle(0, 0, this.hitRadius);
    art.lineStyle(2, 0xffc05b, 0.9).strokeCircle(0, 0, 14);
    art.lineStyle(2, 0xffd386, 0.82);
    art.beginPath().moveTo(0, -17).lineTo(15, 9).lineTo(-15, 9).closePath().strokePath();
    art.fillStyle(0xff7846, 0.9).fillCircle(0, 0, 4);
    this.hpIndicators = scene.add.graphics();
    this.drawHpIndicators();
    this.add(art);
    this.add(this.hpIndicators);
    this.setDepth(7);
    scene.add.existing(this);
  }

  get worldPosition(): Vector2 { return { x: this.x, y: this.y }; }

  applyWeaponHit(_amount: number, sourceId: string): DamageResult | null {
    const result = applyLavaSigilHit(this, sourceId);
    if (result) this.drawHpIndicators();
    return result;
  }

  advance(deltaMs: number): 'active' | 'expired' | 'destroyed' {
    const result = advanceLavaSigil(this, deltaMs);
    if (result !== 'active') return result;
    this.elapsedMs += deltaMs;
    const urgency = this.remainingMs < 900 ? 0.22 + 0.78 * Math.abs(Math.sin(this.elapsedMs / 55)) : 0.9 + Math.sin(this.elapsedMs / 180) * 0.1;
    this.setAlpha(urgency);
    return 'active';
  }

  toState(): LavaSigilState {
    return { id: this.sigilId, x: this.x, y: this.y, hp: this.hp, remainingMs: this.remainingMs };
  }

  private drawHpIndicators(): void {
    this.hpIndicators.clear();
    for (let index = 0; index < 3; index += 1) {
      this.hpIndicators.fillStyle(index < this.hp ? 0xffdc87 : 0x65343b, 1).fillCircle(-8 + index * 8, 28, 2.5);
    }
  }
}
