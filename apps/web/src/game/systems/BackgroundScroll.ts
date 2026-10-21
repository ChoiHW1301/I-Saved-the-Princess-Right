import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';

export type BiomeId = 'castle' | 'lava' | 'meadow-village';
const palettes: Record<BiomeId, { ground: number; alternate: number; road: number; detail: number }> = {
  castle: { ground: 0x25312d, alternate: 0x2b3832, road: 0x615747, detail: 0x52665b },
  lava: { ground: 0x3b2522, alternate: 0x462a24, road: 0x6b3829, detail: 0xda7140 },
  'meadow-village': { ground: 0x455b37, alternate: 0x50683d, road: 0x827455, detail: 0xa6b36a },
};

export class BackgroundScroll {
  private readonly tile: Phaser.GameObjects.TileSprite;
  private distance = 0;
  readonly travelSpeed = 34;
  constructor(private readonly scene: Phaser.Scene, initialBiome: BiomeId = 'castle') {
    this.tile = scene.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, this.textureFor(initialBiome)).setOrigin(0).setDepth(-20);
    scene.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0.14).setDepth(-19);
  }
  update(delta: number): void {
    const step = this.travelSpeed * delta / 1000;
    this.distance += step;
    this.tile.tilePositionY -= step;
  }
  getDistance(): number { return this.distance; }
  setBiome(biome: BiomeId): void { this.tile.setTexture(this.textureFor(biome)); }
  private textureFor(biome: BiomeId): string {
    const key = `terrain-${biome}`;
    if (this.scene.textures.exists(key)) return key;
    const p = palettes[biome];
    const g = this.scene.add.graphics();
    g.fillStyle(p.ground).fillRect(0, 0, 128, 128);
    g.fillStyle(p.alternate);
    for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 ? 0 : 16; x < 128; x += 32) g.fillRect(x, y, 16, 16);
    g.fillStyle(p.road, 0.78).fillRect(52, 0, 25, 128);
    g.fillStyle(p.detail, 0.55);
    for (let i = 0; i < 9; i += 1) g.fillRect((i * 37 + 11) % 128, (i * 53 + 19) % 128, 4, 4);
    g.generateTexture(key, 128, 128);
    g.destroy();
    return key;
  }
}
