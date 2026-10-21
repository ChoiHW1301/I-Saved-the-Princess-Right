import Phaser from 'phaser';

export class Caravan extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    const art = scene.add.graphics();
    art.fillStyle(0x171614, 0.35).fillEllipse(0, 37, 196, 35);
    art.fillStyle(0x5b3021).fillRoundedRect(-73, -8, 146, 69, 12);
    art.fillStyle(0x9d542e).fillRoundedRect(-61, -54, 122, 91, 35);
    art.lineStyle(5, 0xe5b76f, 1).strokeRoundedRect(-61, -54, 122, 91, 35);
    art.fillStyle(0x38251e).fillRoundedRect(-37, -31, 74, 60, 22);
    art.fillStyle(0xf1d4a2).fillCircle(0, -9, 17);
    art.fillStyle(0x291b16).fillTriangle(-45, -57, 45, -57, 0, -89);
    art.fillStyle(0xf4d789).fillTriangle(-3, -65, 3, -65, 0, -79);
    for (const wheelX of [-56, 56]) {
      art.fillStyle(0x231b16).fillCircle(wheelX, 45, 20);
      art.lineStyle(4, 0xe1b76e).strokeCircle(wheelX, 45, 16);
      art.lineBetween(wheelX - 13, 45, wheelX + 13, 45);
      art.lineBetween(wheelX, 32, wheelX, 58);
    }
    this.add(art);
    this.setDepth(20);
    scene.add.existing(this);
  }
}
