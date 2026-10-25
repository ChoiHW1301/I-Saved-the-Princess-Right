# Task: T01 Fixed 4:3 World and Road Alignment

## Status: done

## Goal

Render every run in one fixed 4:3 composition that uniformly scales with the browser and leaves unused space as margins. Keep the caravan at the center of the world and vertically align the road lane in all three terrain images with the caravan.

## Decision Summary

- Logical game size is 960 x 720 (4:3); browser resizing scales the existing composition and never changes its aspect ratio.
- `ROAD_CENTER_Y` is 360. Background art scrolls beneath the stationary caravan, with each biome road visually centered on that coordinate.
- Old run saves were written for a 1280 x 720 world and must be mapped into the new world when resumed.

## Implementation

### I01. Define the 4:3 world and fit it to the page

- Related Files:
  - `apps/web/src/game/config/createGameConfig.ts` :: `WORLD_WIDTH`, `WORLD_HEIGHT`, `ROAD_CENTER_Y`, `createGameConfig`; modify
  - `apps/web/src/features/home/HomePage.css` :: `.game-shell`, `.game-frame`; modify
  - `apps/web/src/features/home/HomePage.tsx` :: active-game render branch; modify

#### Details

- Set `WORLD_WIDTH = 960`, `WORLD_HEIGHT = 720`, `ROAD_CENTER_Y = WORLD_HEIGHT / 2`.
- Keep Phaser `Scale.FIT` and `CENTER_BOTH`; the Phaser logical size and the React frame must both be 4:3.
- Make `.game-frame` fit the available browser width and height while preserving `aspect-ratio: 4 / 3`; center it in `.game-shell`. Do not add a ratio preference, menu, or setting. Do not crop the canvas or independently reposition its children as the browser resizes.
- The responsive sizing rule must account for the existing game top bar and shell padding so the entire 4:3 frame fits the available viewport height. Any remaining space stays around the centered frame.
- Keep the same logical coordinates at every browser size; Phaser's existing FIT scaling performs uniform scaling.

#### Data & Schema Fields

- No new persisted setting. The ratio is fixed by `WORLD_WIDTH` and `WORLD_HEIGHT`.

### I02. Align the caravan, player, and terrain road

- Related Files:
  - `apps/web/src/game/systems/BackgroundScroll.ts` :: `BackgroundScroll` constructor and `setTransition`; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `update`, `createRunSnapshot`; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot`; modify
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema`; modify
  - `packages/contracts/test/schema.test.ts` :: old-save defaults; modify
  - `apps/web/src/game/test/CaravanScene.test.ts` :: world-coordinate migration tests; modify

#### Details

- Place the caravan at `(WORLD_WIDTH / 2, ROAD_CENTER_Y)` and retain the initial player offset of 145 world pixels to its left, with player Y equal to `ROAD_CENTER_Y`.
- Adjust `BackgroundScroll.baseTile` and `overlayTile` vertical texture offsets per biome so the visible road midline, not the terrain image midpoint, aligns to Y=360. The terrain images are 1254 x 1254 and are displayed at tile scale 0.5. Measure the lane midline in each of `terrain-lava-fields.png`, `terrain-demon-castle.png`, and `terrain-meadow-village.png`; store the source/world offset per `StageId`, and use the same mapping for both transition tiles to avoid a jump during biome crossfade.
- Extend the run snapshot with backwards-compatible world metadata:
  - `worldWidth: number`, default 1280 when parsing an older snapshot.
  - `roadCenterY: number`, default 267 when parsing an older snapshot.
- New snapshots write `worldWidth: 960` and `roadCenterY: 360`.
- On resume, map every saved player and enemy world point with `x = savedX * 960 / snapshot.worldWidth` and `y = savedY + (360 - snapshot.roadCenterY)`, then clamp coordinates to the 960 x 720 world bounds. New saves map to themselves; legacy 1280 x 720 saves shift to the centered lane.
- `SnapshotInput` includes the world metadata and `createSnapshot` serializes it. Add optional/defaulted Zod fields so existing strict V1 snapshots remain parseable.

#### Signatures & Types

```typescript
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 720;
export const ROAD_CENTER_Y = WORLD_HEIGHT / 2;

export interface SnapshotInput {
  run: RunState;
  player: { x: number; y: number };
  rngSeed: number;
  ordinarySpawnCooldownMs: number;
  enemies: readonly SnapshotEnemy[];
  worldWidth: number;
  roadCenterY: number;
  activeBossMaxHp?: number;
  pendingEventId?: string | null;
}
```

### I03. Validate viewport and legacy positioning

- Manual check: at wide and narrow browser window sizes, the game frame stays 4:3, scales uniformly, remains centered, and shows margins instead of stretching or cropping.
- Manual check: start a run and confirm the caravan center and road lane line up in the lava, ruins, and meadow biomes, including while their 30-second transition crossfades.
- Unit check: parse a legacy snapshot without `worldWidth`/`roadCenterY` and assert defaults 1280/267; verify old player/enemy X positions are scaled and their Y positions are shifted by +93; verify new 960/360 positions remain unchanged.

## Acceptance Criteria

- [ ] The game frame remains 4:3 at every browser size, scales uniformly, and leaves letterbox margins where needed.
- [ ] The caravan is centered at world coordinate `(480, 360)` and the road lane is centered beneath it in all three biomes.
- [ ] Existing saved runs from the 1280 x 720 world resume with player and enemies inside the new world and aligned to the road.
- [ ] Newly saved runs resume at the same positions without a second migration shift.

## Validation

- `npm run test --workspace @caravan/contracts -- test/schema.test.ts`
- `npm run test --workspace @caravan/web -- src/game/test/CaravanScene.test.ts`
- `npm run typecheck --workspace @caravan/web`
- Browser resize and biome alignment checks described in I03.

## Commit Message

```text
feat(game): center the caravan in a fixed 4:3 world

Plan: 2026-10-23-caravan-gameplay-polish
Phase: P01-world-gameplay
Task: T01-fixed-4-3-world

- Scale the same 4:3 playfield to browser bounds
- Align biome roads and migrate legacy saved coordinates
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual browser viewport/biome visual check (preview tool could not attach)
- commit: not created because the worktree contains extensive pre-existing edits; staging these files wholesale would include unrelated work

