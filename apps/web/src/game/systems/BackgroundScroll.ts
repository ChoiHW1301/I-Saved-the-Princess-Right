import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config/createGameConfig.js';
import { biomeSchedule, type StageId } from '../content/biomes.js';

const ROAD_ART_CENTERS: Readonly<Record<StageId, number>> = {
  'demon-castle': 628,
  'lava-fields': 596,
  'enchanted-forest': 627,
  'meadow-village': 705,
};
const ROAD_VERTICAL_OFFSET = 146;

export class BackgroundScroll {
  private readonly baseTile: Phaser.GameObjects.TileSprite;
  private readonly overlayTile: Phaser.GameObjects.TileSprite;
  private readonly tintWash: Phaser.GameObjects.Rectangle;
  private currentFrom: StageId;
  private currentTo: StageId;
  private distance = 0;
  readonly travelSpeed = 82;
  constructor(private readonly scene: Phaser.Scene, initialBiome: StageId = 'lava-fields') {
    this.currentFrom = initialBiome;
    this.currentTo = initialBiome;
    const initialTexture = this.textureFor(initialBiome);
    this.baseTile = scene.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, initialTexture).setOrigin(0).setTileScale(0.5).setDepth(-20);
    this.overlayTile = scene.add.tileSprite(0, 0, WORLD_WIDTH, WORLD_HEIGHT, initialTexture).setOrigin(0).setTileScale(0.5).setDepth(-19).setAlpha(0);
    this.alignRoad(this.baseTile, initialBiome);
    this.alignRoad(this.overlayTile, initialBiome);
    scene.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x10121a, 0.08).setDepth(-9);
    const initialTint = biomeSchedule.find((biome) => biome.id === initialBiome)!.accentColor;
    this.tintWash = scene.add.rectangle(0, 0, WORLD_WIDTH, WORLD_HEIGHT, initialTint, 0.06).setOrigin(0).setDepth(-8);
  }
  update(delta: number): void {
    const step = this.travelSpeed * delta / 1000;
    this.distance += step;
    this.baseTile.tilePositionX += step * 0.48;
    this.overlayTile.tilePositionX += step * 0.48;
  }
  getDistance(): number { return this.distance; }
  setTransition(from: StageId, to: StageId, progress: number): void {
    if (this.currentFrom !== from) {
      const scrollX = this.baseTile.tilePositionX;
      this.baseTile.setTexture(this.textureFor(from));
      this.alignRoad(this.baseTile, from, scrollX);
    }
    if (this.currentTo !== to) {
      const scrollX = this.overlayTile.tilePositionX;
      this.overlayTile.setTexture(this.textureFor(to));
      this.alignRoad(this.overlayTile, to, scrollX);
    }
    this.currentFrom = from;
    this.currentTo = to;
    const amount = from === to ? 1 : Phaser.Math.Clamp(progress, 0, 1);
    this.overlayTile.setAlpha(from === to ? 0 : amount);
    const fromTint = biomeSchedule.find((biome) => biome.id === from)!.accentColor;
    const toTint = biomeSchedule.find((biome) => biome.id === to)!.accentColor;
    this.tintWash.setFillStyle(interpolateColor(fromTint, toTint, amount), from === to ? 0.06 : 0.12);
  }
  private textureFor(biome: StageId): string {
    const key = `terrain-${biome}`;
    if (this.scene.textures.exists(key)) return key;
    const palette = biomeSchedule.find((definition) => definition.id === biome)!;
    const g = this.scene.add.graphics();
    g.fillStyle(palette.primaryColor).fillRect(0, 0, 128, 128);
    g.fillStyle(palette.alternateColor);
    g.fillStyle(palette.accentColor, 0.55);
    for (let i = 0; i < 28; i += 1) {
      const x = (i * 37 + 11) % 128;
      const y = (i * 53 + 19) % 128;
      g.fillRect(x, y, 3, 3);
      g.fillRect(x + 3, y + 1, 2, 2);
    }
    g.generateTexture(key, 128, 128);
    g.destroy();
    return key;
  }

  private alignRoad(tile: Phaser.GameObjects.TileSprite, biome: StageId, scrollX = tile.tilePositionX): void {
    // Align each painting's measured road midline just below the caravan's center.
    // Tile position is inverted relative to the visible texture movement.
    const sourceRoadCenterY = ROAD_ART_CENTERS[biome];
    const scaledRoadCenterY = sourceRoadCenterY * 0.5;
    // Changing a biome texture must not reset the shared horizontal scroll offset.
    // Resetting X here caused the whole terrain to jump when a crossfade finished.
    tile.setTilePosition(scrollX, scaledRoadCenterY - (WORLD_HEIGHT / 2 + ROAD_VERTICAL_OFFSET));
  }
}

function interpolateColor(from: number, to: number, amount: number): number {
  const channel = (shift: number): number => Math.round(((from >> shift) & 0xff) * (1 - amount) + ((to >> shift) & 0xff) * amount);
  return (channel(16) << 16) | (channel(8) << 8) | channel(0);
}
