import Phaser from 'phaser';
import type { EnemyDefinition, EnemyTarget } from '../content/enemies.js';
import { resolveHit, type DamageResult, type WeaponAttackTarget, type Vector2 } from '../systems/CombatSystem.js';
import { BOSS_COLLISION_RADIUS, getLavaGiantFacing } from '../systems/BossGimmickSystem.js';

let nextEnemyId = 1;
export class Enemy extends Phaser.GameObjects.Container implements WeaponAttackTarget {
  readonly id = `enemy-${nextEnemyId++}`;
  hp: number;
  readonly maxHp: number;
  dead = false;
  damageTakenMultiplier = 1;
  attackCooldownMs = 0;
  target: EnemyTarget = 'warrior';
  private readonly bodyImage: Phaser.GameObjects.Image;
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private readonly bodyBaseTint: number;
  private weaknessMark?: Phaser.GameObjects.Graphics;
  private bossTellBlinkMs = 300;
  private burnTween?: Phaser.Tweens.Tween;
  private burning = false;
  private deathEffectPlayed = false;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly definition: EnemyDefinition, readonly bossMilestoneId?: string) {
    super(scene, x, y);
    this.hp = definition.maxHp;
    this.maxHp = definition.maxHp;
    this.shadow = scene.add.ellipse(2, definition.flying ? 24 : 14, bossMilestoneId ? 66 : definition.flying ? 24 : definition.wagonPriority ? 30 : 48, bossMilestoneId ? 23 : definition.flying ? 12 : 16, 0x100d12, 0.55);
    const size = bossMilestoneId ? 92 : definition.flying ? 38 : definition.wagonPriority ? 40 : 62;
    this.bodyBaseTint = definition.flying && !bossMilestoneId ? 0x8fe4f4
      : definition.wagonPriority && !bossMilestoneId ? 0xffc16b : 0xffffff;
    const bodyTexture = definition.id === 'lava-giant' ? 'lava-giant-down'
      : definition.id === 'lava-magician' ? 'lava-magician'
        : definition.rewardMonster ? 'fortune-wraith-sprite' : 'demon-sprite';
    this.bodyImage = scene.add.image(0, definition.flying ? -10 : 0, bodyTexture).setDisplaySize(size, size);
    if (definition.flying && !bossMilestoneId) {
      this.bodyImage.setTint(this.bodyBaseTint);
      this.add([
        scene.add.triangle(-14, -7, 0, 10, 12, 0, 0xb9f4fc).setRotation(-0.25),
        scene.add.triangle(14, -7, 12, 0, 0, 10, 0xb9f4fc).setRotation(0.25),
      ]);
      scene.tweens.add({ targets: this.bodyImage, y: -15, duration: 240, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (definition.wagonPriority && !bossMilestoneId) this.bodyImage.setTint(this.bodyBaseTint);
    this.add([this.shadow, this.bodyImage]);
    if (bossMilestoneId) {
      this.add([
        scene.add.triangle(-12, -26, 0, 14, 12, 14, 0xd4a84f).setRotation(-0.2),
        scene.add.triangle(12, -26, 0, 14, 12, 14, 0xd4a84f).setRotation(0.2),
      ]);
    }
    if (bossMilestoneId && (definition.id === 'lava-giant' || definition.id === 'lava-magician')) this.setScale(2);
    this.setDepth(8);
    scene.add.existing(this);
  }
  get worldPosition(): Vector2 { return { x: this.x, y: this.y }; }
  get hitRadius(): number {
    if (this.bossMilestoneId && (this.definition.id === 'lava-giant' || this.definition.id === 'lava-magician')) return BOSS_COLLISION_RADIUS;
    return this.bossMilestoneId ? 48 : this.definition.flying ? 18 : 26;
  }
  applyWeaponHit(amount: number, sourceId: string): DamageResult | null { return resolveHit(this, amount, sourceId); }
  setFacingDirection(horizontalDelta: number): void {
    if (horizontalDelta === 0) return;
    this.bodyImage.setFlipX(horizontalDelta < 0);
  }
  setBossDirection(dx: number, dy: number): void {
    if (this.definition.id !== 'lava-giant') return;
    const facing = getLavaGiantFacing(dx, dy);
    this.bodyImage.setTexture(facing.texture).setFlipX(facing.flipX);
  }
  setBossTell(active: boolean, elapsedMs = 0): void {
    if (this.definition.id !== 'lava-giant' || this.deathEffectPlayed) return;
    if (!active) { this.bodyImage.setAlpha(1); return; }
    this.bossTellBlinkMs = Phaser.Math.Linear(300, 80, Phaser.Math.Clamp(elapsedMs / 2_000, 0, 1));
    this.bodyImage.setAlpha(Math.floor(Math.max(0, elapsedMs) / Math.max(1, this.bossTellBlinkMs)) % 2 === 0 ? 0.38 : 1);
  }
  setBossStunned(stunned: boolean, chargeAngle = 0): void {
    if (this.definition.id !== 'lava-giant' || this.deathEffectPlayed) return;
    if (stunned) {
      this.bodyImage.setAngle(90 + Phaser.Math.RadToDeg(chargeAngle)).setAlpha(1);
      this.shadow.setScale(1.24, 1.55).setFillStyle(0x32170e, 0.78);
      if (!this.weaknessMark) {
        this.weaknessMark = this.scene.add.graphics().fillStyle(0xffc94f, 0.24).fillEllipse(0, 24, 74, 32)
          .lineStyle(3, 0xffe49a, 0.9).strokeEllipse(0, 24, 74, 32);
        this.addAt(this.weaknessMark, 1);
      }
      this.weaknessMark.setVisible(true);
    } else {
      this.bodyImage.setAngle(0).setAlpha(1);
      this.shadow.setScale(1).setFillStyle(0x100d12, 0.55);
      this.weaknessMark?.setVisible(false);
    }
  }
  setBurning(active: boolean): void {
    if (this.burning === active || this.deathEffectPlayed) return;
    this.burning = active;
    this.burnTween?.stop();
    this.burnTween = undefined;
    if (active) {
      this.bodyImage.setTint(0xff8a32);
      this.burnTween = this.scene.tweens.add({ targets: this.bodyImage, alpha: 0.32, duration: 120, yoyo: true, repeat: -1, ease: 'Linear' });
    } else {
      this.bodyImage.setAlpha(1);
      this.restoreBodyTint();
    }
  }
  damage(amount: number): void {
    if (this.dead || !Number.isFinite(amount) || amount <= 0) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp === 0) {
      this.dead = true;
      this.playHitEffect();
      return;
    }
    this.playHitEffect();
  }

  playDeathEffect(): void {
    if (this.deathEffectPlayed) return;
    this.setBurning(false);
    this.deathEffectPlayed = true;
    if (!this.bossMilestoneId) {
      this.setVisible(false);
      this.bodyImage.setVisible(false);
      const tint = this.definition.id === 'imp' ? 0x70e5f5
        : this.definition.rewardMonster ? 0xffd34e : 0xb5c979;
      const deathSprite = this.scene.add.sprite(this.x, this.y + this.bodyImage.y, 'death-keep-ghoul')
        .setDisplaySize(Math.max(40, this.bodyImage.displayWidth), Math.max(48, this.bodyImage.displayWidth * 4 / 3))
        .setTint(tint)
        .setDepth(this.depth + 1);
      deathSprite.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        deathSprite.destroy();
        this.destroy();
      });
      deathSprite.play('monster-death');
      return;
    }
    const color = this.effectColor();
    const scene = this.scene;
    const deathSprite = scene.add.image(this.x, this.y + this.bodyImage.y, 'demon-sprite')
      .setDisplaySize(this.bodyImage.displayWidth, this.bodyImage.displayHeight)
      .setTint(color)
      .setDepth(this.depth + 1);
    const fragmentCount = this.bossMilestoneId ? 14 : this.definition.flying ? 7 : this.definition.wagonPriority ? 9 : 6;
    for (let index = 0; index < fragmentCount; index += 1) {
      const angle = index / fragmentCount * Math.PI * 2;
      const distance = 22 + (index % 3) * 7;
      const fragment = scene.add.rectangle(this.x, this.y + this.bodyImage.y, 4 + index % 3, 4 + index % 2, color)
        .setDepth(this.depth + 2);
      scene.tweens.add({
        targets: fragment,
        x: fragment.x + Math.cos(angle) * distance,
        y: fragment.y + Math.sin(angle) * distance,
        angle: 90 + index * 37,
        alpha: 0,
        duration: this.bossMilestoneId ? 420 : 280,
        ease: 'Cubic.easeOut',
        onComplete: () => fragment.destroy(),
      });
    }
    this.setVisible(false);
    scene.tweens.add({
      targets: deathSprite,
      scaleX: 0.35,
      scaleY: 0.35,
      alpha: 0,
      y: deathSprite.y + 8,
      duration: this.bossMilestoneId ? 420 : 280,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        deathSprite.destroy();
        this.destroy();
      },
    });
  }

  private playHitEffect(): void {
    const color = this.effectColor();
    this.bodyImage.setTint(color).setTintFill();
    this.scene.time.delayedCall(85, () => {
      if (!this.bodyImage.active || this.deathEffectPlayed) return;
      this.restoreBodyTint();
    });
    const ring = this.scene.add.circle(this.x, this.y + this.bodyImage.y, 11, color, 0.15)
      .setStrokeStyle(2, color, 0.92)
      .setDepth(this.depth + 1);
    this.scene.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 130, onComplete: () => ring.destroy() });
  }

  private restoreBodyTint(): void {
    if (this.bodyBaseTint === 0xffffff) this.bodyImage.clearTint();
    else this.bodyImage.setTint(this.bodyBaseTint);
  }

  private effectColor(): number {
    if (this.bossMilestoneId) return 0xffd45c;
    if (this.definition.flying) return 0x76eaff;
    if (this.definition.wagonPriority) return 0xffa34d;
    return 0xc9f274;
  }
}
