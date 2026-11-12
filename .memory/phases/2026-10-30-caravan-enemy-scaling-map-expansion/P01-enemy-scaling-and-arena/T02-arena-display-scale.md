# Task: T02 Arena Display Scale

## Status: pending

## Goal
Show a larger, more open playable arena in the existing fixed 4:3 game frame, keeping the wagon at the visible center and HUD readable while world sprites appear at 75% of their current apparent size.

## Decision Summary
- Preserve the browser frame aspect ratio at 4:3 and do not pan/follow the camera.
- Increase the logical world dimensions from 960×720 to 1280×960 and fit the full world to the same frame, resulting in 75% display scale and about 1.33× visible world width/height.
- Keep HUD positions and apparent size tied to the 960×720 screen view rather than enlarging with the world.

## Implementation

### I01. Separate game view from logical world dimensions

- Related Files:
  - `apps/web/src/game/config/createGameConfig.ts` :: world/view constants, `createGameConfig` — define fixed 4:3 display view and expanded logical world; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `spawnEnemy`, `startBoss`, `updateHud`, `drawKarmaGauge`, `drawKarmaWings`, `createRunSnapshot` — keep actors in the expanded world and HUD fixed to the view; modify.
  - `apps/web/src/game/systems/BackgroundScroll.ts` :: `BackgroundScroll`, `alignRoad` — tile terrain across the expanded world and retain road alignment; modify.
- **Signatures & Types**:
  ```typescript
  export const VIEW_WIDTH = 960;
  export const VIEW_HEIGHT = 720;
  export const WORLD_WIDTH = 1280;
  export const WORLD_HEIGHT = 960;
  export const ROAD_CENTER_Y = WORLD_HEIGHT / 2;
  ```
- **Execution Flow / Logic**:
  1. Configure Phaser's display canvas and FIT scale mode with a 4:3 aspect ratio; retain a 960×720 view so the existing `.game-frame` remains unchanged.
  2. Set logical world dimensions to 1280×960 and place the caravan at the world center (640,480). Set the main camera to show the full world at zoom 0.75, centered on the caravan; do not enable camera follow.
  3. Set camera and Arcade bounds to the full world. Keep player movement and spawn bounds inside these expanded boundaries.
  4. Resize background `TileSprite`, tint overlays, and biome transition layers to 1280×960. Recalculate road alignment using the expanded road center while preserving existing texture scroll offsets.
  5. Spawn incoming encounter sprites relative to the expanded world's right edge and update all world-centered effects to use the expanded center.
  6. Keep HUD layout in view coordinates (960×720), including top status panel, bars, karma wings/gauge, warning text, pause position, and damage indicators; ensure HUD stays legible and screen anchored under the world view scale.
  7. Save snapshots with expanded `worldWidth` and road center. Existing restore logic in `mapSnapshotWorldPoint` must continue remapping old 960×720 snapshots into the new world and preserve the player's/cart-relative position.

### I02. Keep gameplay geometry and UI aligned

- Related Files:
  - `apps/web/src/game/entities/Caravan.ts` :: `Caravan` — preserve centered draw order and relative collision footprint as the world is shown at 75%; read-only unless positioning constants need adjustment.
  - `apps/web/src/game/entities/Warrior.ts` :: `Warrior` — retain current world movement speed and collision behavior; read-only unless display/collider mismatch is exposed by the new view scale.
  - `apps/web/src/features/home/HomePage.css` :: `.game-frame` — preserve the existing 4:3 frame; read-only.
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `mapSnapshotWorldPoint`, `createSnapshot` — verify old-save coordinate conversion uses stored world width and road center; modify only if the expanded-world conversion does not preserve relative position.
- **Execution Flow / Logic**:
  1. Verify world sprites are uniformly reduced by camera scale without stretching or cropping, and that the wagon stays visually at the center of the screen.
  2. Verify HUD does not drift with the world, does not become unreadably small, and remains within the 4:3 viewport.
  3. Preserve the world coordinate scale for movement speeds, combat ranges, collision sizes, and spawn distances; only view scale and world extent change.
  4. Keep prior save compatibility by transforming saved points from saved world dimensions into the new world dimensions.

## Acceptance Criteria
- [ ] The browser game frame remains 4:3 at all browser sizes.
- [ ] A 1280×960 logical arena is visible at 75% scale, with the wagon centered and no camera follow/pan.
- [ ] World sprites and terrain remain proportional; no clipping or aspect distortion occurs.
- [ ] HUD remains screen-anchored and comfortably readable.
- [ ] Player movement bounds and all world spawn bounds include the expanded area.
- [ ] Existing 960×720 saves restore with the player and saved entities in corresponding relative positions.

## Validation
- `npm run typecheck --workspace @caravan/web` — web TypeScript compilation succeeds.
- `npm run build --workspace @caravan/web` — production web build succeeds.
- Do not add or run tests unless the user asks.

## Commit Message
```text
feat(game): expand arena view while preserving 4:3

Plan: 2026-10-30-caravan-enemy-scaling-map-expansion
Phase: P01-enemy-scaling-and-arena
Task: T02-arena-display-scale

- Expand the logical arena and show it at 75% in the fixed 4:3 frame
- Keep the wagon centered and HUD anchored to the screen view
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
