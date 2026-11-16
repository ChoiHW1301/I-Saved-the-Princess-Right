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
  private readonly fuseRing: Phaser.GameObjects.Graphics;
  private readonly explosionWarning: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, readonly sigilId: string, x: number, y: number, hp = LAVA_SIGIL_MAX_HP, remainingMs = LAVA_SIGIL_FUSE_MS) {
    super(scene, x, y);
    this.id = sigilId;
    this.name = sigilId;
    this.hp = Phaser.Math.Clamp(Math.floor(hp), 1, this.maxHp);
    this.remainingMs = Phaser.Math.Clamp(remainingMs, 1, LAVA_SIGIL_FUSE_MS);
    this.elapsedMs = LAVA_SIGIL_FUSE_MS - this.remainingMs;

    this.explosionWarning = scene.add.graphics().fillStyle(0xff542f, 0.22).fillCircle(0, 0, 100)
      .lineStyle(4, 0xffb15b, 0.8).strokeCircle(0, 0, 100).setScale(0).setVisible(false);
    const art = scene.add.image(0, 0, 'lava-sigil').setDisplaySize(82, 82);
    this.fuseRing = scene.add.graphics();
    this.hpIndicators = scene.add.graphics();
    this.drawHpIndicators();
    this.add([this.explosionWarning, art, this.fuseRing]);
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
    const urgency = this.remainingMs <= 1000 ? 0.12 + 0.88 * Math.abs(Math.sin(this.elapsedMs / Math.max(28, this.remainingMs * 0.12))) : 0.9 + Math.sin(this.elapsedMs / 180) * 0.1;
    this.setAlpha(urgency);
    this.drawFuseRing();
    if (this.remainingMs <= 300) {
      this.explosionWarning.setVisible(true).setScale(Phaser.Math.Clamp(1 - this.remainingMs / 300, 0, 1));
    } else this.explosionWarning.setVisible(false);
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

  private drawFuseRing(): void {
    const progress = Phaser.Math.Clamp(this.remainingMs / LAVA_SIGIL_FUSE_MS, 0, 1);
    this.fuseRing.clear().lineStyle(3, this.remainingMs <= 1000 ? 0xff5f36 : 0xffd47d, 0.92)
      .beginPath().arc(0, 0, 39, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false).strokePath();
  }
}
