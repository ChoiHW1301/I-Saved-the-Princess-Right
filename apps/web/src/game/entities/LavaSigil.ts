import Phaser from 'phaser';
import { type DamageResult, type Vector2, type WeaponAttackTarget } from '../systems/CombatSystem.js';
import { advanceLavaSigil, applyLavaSigilHit, LAVA_SIGIL_DISPLAY_DIAMETER, LAVA_SIGIL_EXPLOSION_RADIUS, LAVA_SIGIL_FUSE_MS, LAVA_SIGIL_HIT_RADIUS, LAVA_SIGIL_MAX_HP } from '../systems/LavaSigilSystem.js';

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
  readonly hitRadius = LAVA_SIGIL_HIT_RADIUS;
  hp: number;
  dead = false;
  remainingMs: number;
  private elapsedMs: number;
  private readonly hpIndicators: Phaser.GameObjects.Graphics;
  private readonly fuseRing: Phaser.GameObjects.Graphics;
  private readonly rangeOutline: Phaser.GameObjects.Graphics;
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
    const art = scene.add.image(0, 0, 'lava-sigil').setDisplaySize(LAVA_SIGIL_DISPLAY_DIAMETER, LAVA_SIGIL_DISPLAY_DIAMETER);
    this.rangeOutline = scene.add.graphics().lineStyle(2, 0xffa64c, 0.78).strokeCircle(0, 0, LAVA_SIGIL_EXPLOSION_RADIUS);
    this.fuseRing = scene.add.graphics();
    this.hpIndicators = scene.add.graphics();
    this.drawHpIndicators();
    this.add([art, this.rangeOutline, this.fuseRing, this.explosionWarning]);
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

  playDestroyEffect(): void {
    const { x, y } = this;
    const scene = this.scene;
    this.setVisible(false);
    const ring = scene.add.circle(x, y, LAVA_SIGIL_EXPLOSION_RADIUS, 0xffc857, 0)
      .setStrokeStyle(4, 0xffe29a, 0.95).setScale(0.15).setDepth(13);
    scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 260, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
    for (let index = 0; index < 10; index += 1) {
      const angle = index / 10 * Math.PI * 2;
      const startRadius = 18 + (index % 3) * 8;
      const distance = 42 + (index % 4) * 9;
      const shard = scene.add.rectangle(
        x + Math.cos(angle) * startRadius,
        y + Math.sin(angle) * startRadius,
        5 + index % 3,
        4 + index % 2,
        index % 2 === 0 ? 0xffd36b : 0xff7038,
      ).setRotation(angle).setDepth(14);
      scene.tweens.add({
        targets: shard,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        angle: Phaser.Math.RadToDeg(angle) + 100,
        alpha: 0,
        duration: 240 + index % 3 * 30,
        ease: 'Cubic.easeOut',
        onComplete: () => shard.destroy(),
      });
    }
    scene.time.delayedCall(330, () => this.destroy());
  }

  private drawHpIndicators(): void {
    this.hpIndicators.clear();
    for (let index = 0; index < this.maxHp; index += 1) {
      this.hpIndicators.fillStyle(index < this.hp ? 0xffdc87 : 0x65343b, 1).fillCircle(-8 + index * 8, 28, 2.5);
    }
  }

  private drawFuseRing(): void {
    const progress = Phaser.Math.Clamp(this.remainingMs / LAVA_SIGIL_FUSE_MS, 0, 1);
    this.fuseRing.clear().lineStyle(3, this.remainingMs <= 1000 ? 0xff5f36 : 0xffd47d, 0.92)
      .beginPath().arc(0, 0, LAVA_SIGIL_EXPLOSION_RADIUS, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress, false).strokePath();
  }
}
