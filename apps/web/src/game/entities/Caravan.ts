import Phaser from 'phaser';

export const CARAVAN_SPRITE_WIDTH = 248;
export const CARAVAN_SPRITE_HEIGHT = 142;

export class Caravan extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const shadow = scene.add.ellipse(0, 37, 218, 42, 0x110f18, 0.45);
    const sprite = scene.add.image(0, 0, 'caravan-sprite').setDisplaySize(CARAVAN_SPRITE_WIDTH, CARAVAN_SPRITE_HEIGHT);
    this.add([shadow, sprite]);
    this.setDepth(6);
    scene.add.existing(this);
    scene.tweens.add({ targets: this, y: y + 2, duration: 320, ease: 'Sine.inOut', yoyo: true, repeat: -1 });
  }
}
