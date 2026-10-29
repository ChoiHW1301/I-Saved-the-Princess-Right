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
  target: EnemyTarget = 'warrior';
  private readonly bodyImage: Phaser.GameObjects.Image;
  private readonly bodyBaseTint: number;
  private deathEffectPlayed = false;
  constructor(scene: Phaser.Scene, x: number, y: number, readonly definition: EnemyDefinition, readonly bossMilestoneId?: string) {
    super(scene, x, y);
    this.hp = definition.maxHp;
    this.maxHp = definition.maxHp;
    const shadow = scene.add.ellipse(2, definition.flying ? 24 : 14, bossMilestoneId ? 66 : definition.flying ? 24 : definition.wagonPriority ? 30 : 48, bossMilestoneId ? 23 : definition.flying ? 12 : 16, 0x100d12, 0.55);
    const size = bossMilestoneId ? 92 : definition.flying ? 38 : definition.wagonPriority ? 40 : 62;
    this.bodyBaseTint = definition.flying && !bossMilestoneId ? 0x8fe4f4
      : definition.wagonPriority && !bossMilestoneId ? 0xffc16b : 0xffffff;
    const bodyTexture = definition.rewardMonster ? 'fortune-wraith-sprite' : 'demon-sprite';
    this.bodyImage = scene.add.image(0, definition.flying ? -10 : 0, bodyTexture).setDisplaySize(size, size);
    if (definition.flying && !bossMilestoneId) {
      this.bodyImage.setTint(this.bodyBaseTint);
      this.add([
        scene.add.triangle(-14, -7, 0, 10, 12, 0, 0xb9f4fc).setRotation(-0.25),
        scene.add.triangle(14, -7, 12, 0, 0, 10, 0xb9f4fc).setRotation(0.25),
      ]);
      scene.tweens.add({ targets: this.bodyImage, y: -15, duration: 240, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    } else if (definition.wagonPriority && !bossMilestoneId) this.bodyImage.setTint(this.bodyBaseTint);
    this.add([shadow, this.bodyImage]);
    if (bossMilestoneId) {
      this.add([
        scene.add.triangle(-12, -26, 0, 14, 12, 14, 0xd4a84f).setRotation(-0.2),
        scene.add.triangle(12, -26, 0, 14, 12, 14, 0xd4a84f).setRotation(0.2),
      ]);
    }
    this.setDepth(8);
    scene.add.existing(this);
  }
  get worldPosition(): Vector2 { return { x: this.x, y: this.y }; }
  setFacingDirection(horizontalDelta: number): void {
    if (horizontalDelta === 0) return;
    this.bodyImage.setFlipX(horizontalDelta < 0);
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
    this.deathEffectPlayed = true;
    if (!this.bossMilestoneId) {
      this.setVisible(false);
      this.bodyImage.setVisible(false);
      const tint = this.definition.id === 'sky-wisp' ? 0x70e5f5
        : this.definition.id === 'wagon-rusher' ? 0xffa057
          : this.definition.id === 'fortune-wraith' ? 0xffd34e : 0xb5c979;
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
      if (this.bodyBaseTint === 0xffffff) this.bodyImage.clearTint();
      else this.bodyImage.setTint(this.bodyBaseTint);
    });
    const ring = this.scene.add.circle(this.x, this.y + this.bodyImage.y, 11, color, 0.15)
      .setStrokeStyle(2, color, 0.92)
      .setDepth(this.depth + 1);
    this.scene.tweens.add({ targets: ring, scale: 1.6, alpha: 0, duration: 130, onComplete: () => ring.destroy() });
  }

  private effectColor(): number {
    if (this.bossMilestoneId) return 0xffd45c;
    if (this.definition.flying) return 0x76eaff;
    if (this.definition.wagonPriority) return 0xffa34d;
    return 0xc9f274;
  }
}
