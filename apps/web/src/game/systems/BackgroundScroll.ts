import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';
import { biomeSchedule, type StageId } from '../content/biomes.js';

export class BackgroundScroll {
  private readonly baseTile: Phaser.GameObjects.TileSprite;
  private readonly overlayTile: Phaser.GameObjects.TileSprite;
  private currentFrom: StageId;
  private currentTo: StageId;
  private distance = 0;
  readonly travelSpeed = 34;
  constructor(private readonly scene: Phaser.Scene, initialBiome: StageId = 'demon-castle') {
    this.currentFrom = initialBiome;
    this.currentTo = initialBiome;
    const initialTexture = this.textureFor(initialBiome);
    this.baseTile = scene.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, initialTexture).setOrigin(0).setDepth(-20);
    this.overlayTile = scene.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, initialTexture).setOrigin(0).setDepth(-19).setAlpha(0);
    scene.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x000000, 0.14).setDepth(-18);
  }
  update(delta: number): void {
    const step = this.travelSpeed * delta / 1000;
    this.distance += step;
    this.baseTile.tilePositionY -= step;
    this.overlayTile.tilePositionY -= step;
  }
  getDistance(): number { return this.distance; }
  setTransition(from: StageId, to: StageId, progress: number): void {
    if (this.currentFrom !== from) this.baseTile.setTexture(this.textureFor(from));
    if (this.currentTo !== to) this.overlayTile.setTexture(this.textureFor(to));
    this.currentFrom = from;
    this.currentTo = to;
    this.overlayTile.setAlpha(from === to ? 0 : Phaser.Math.Clamp(progress, 0, 1));
  }
  private textureFor(biome: StageId): string {
    const key = `terrain-${biome}`;
    if (this.scene.textures.exists(key)) return key;
    const palette = biomeSchedule.find((definition) => definition.id === biome)!;
    const g = this.scene.add.graphics();
    g.fillStyle(palette.primaryColor).fillRect(0, 0, 128, 128);
    g.fillStyle(palette.alternateColor);
    for (let y = 0; y < 128; y += 32) for (let x = (y / 32) % 2 ? 0 : 16; x < 128; x += 32) g.fillRect(x, y, 16, 16);
    g.fillStyle(palette.roadColor, 0.78).fillRect(52, 0, 25, 128);
    g.fillStyle(palette.accentColor, 0.55);
    for (let i = 0; i < 9; i += 1) g.fillRect((i * 37 + 11) % 128, (i * 53 + 19) % 128, 4, 4);
    g.generateTexture(key, 128, 128);
    g.destroy();
    return key;
  }
}
