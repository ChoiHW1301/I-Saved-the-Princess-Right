# Task: T03 Road, HUD, and Monster Collision

## Status: done

## Goal
Move the road downward under the wagon, leave a clear gap before the top-right pause button, and make all monsters respect the same wagon collision footprint while allowing wagon-target enemies to attack and player-target enemies to route around it.

## Decision Summary
- Keep the fixed 4:3 view, centered wagon, current 224×72 collision rectangle, HUD values, and pause-button location.
- Increase `ROAD_VERTICAL_OFFSET` from 34 to 84.
- Keep the top panel from x=14 to x=880.

## Implementation

### I01. Road and HUD layout

- Related Files:
  - `apps/web/src/game/systems/BackgroundScroll.ts` :: `ROAD_VERTICAL_OFFSET`, `alignRoad` — lower all biome roads uniformly by 50 world pixels; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: top HUD background creation — shorten the panel while preserving the seven existing icon/value positions; modify.
  - `apps/web/src/features/home/HomePage.css` :: `.game-pause-button` — read-only; preserve its current top-right position and size.

#### Details
- **Execution Flow / Logic**:
  1. Set `ROAD_VERTICAL_OFFSET = 84`; retain the per-biome source-center data and crossfade code.
  2. Draw the HUD panel with screen x=14 and width=866 (right edge 880), accounting for existing `hudX` and `hudSize` helpers so it remains anchored at the same apparent 4:3 screen position under 0.75 camera zoom.
  3. Do not move or resize the pause button or HUD content.

### I02. Enemy wagon collision and pathing

- Related Files:
  - `apps/web/src/game/systems/EnemyDirector.ts` :: `EnemyDirector.update`, geometry helpers — resolve monster movement against the wagon obstacle; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `caravanCollision` creation and enemy director call — share the exact 224×72 footprint; modify only if exposing constants is necessary.
  - `apps/web/src/game/entities/Enemy.ts` :: visual radius lookup — read-only unless a collision radius is needed from definition data.

#### Details
- **Geometry and flow**:
  1. Define the collision obstacle as the wagon rectangle centered at `caravanPosition`, half-width 112 and half-height 36, expanded by the moving enemy's collision radius so monster sprites stop outside rather than overlap the visible wagon.
  2. For caravan-target enemies, measure distance from the enemy to the expanded rectangle boundary. Move toward its nearest boundary point and emit attacks when this surface distance is within `attackRange`; do not require reaching the wagon center.
  3. For warrior-target enemies, if a straight movement segment intersects the expanded wagon rectangle, route toward the shortest clear outside corner waypoint before continuing toward the warrior.
  4. For enemies already inside the obstacle when the system begins or after restoring a legacy save, push them to the nearest outside edge before continuing movement.
  5. Keep target selection, speed, facing direction, attack cooldown, taunt behavior, damage, and reward handling unchanged.
  6. Do not attach Arcade bodies to `Enemy`: their movement is manually integrated in `EnemyDirector`, so use deterministic geometry collision to avoid post-update overlap that immediately repeats next frame.

## Acceptance Criteria
- [x] All four biome road layers are shifted downward by the same 50 world pixels without changing texture-reset or biome-crossfade behavior.
- [x] HUD background ends before the pause button; HUD values remain anchored.
- [x] Enemy movement resolves outside the wagon collision footprint.
- [x] Caravan-target monsters approach the outside boundary and can still attack the wagon.
- [x] Warrior-target monsters route around the wagon and do not attack through it.
- [x] Existing target priorities, taunt, enemy speeds, and damage values remain unchanged.

## Validation
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`
- Manual browser review is desirable for road alignment and route behavior, but do not run the test suite.

## Commit Message
```text
fix(game): align road hud and wagon collision

Plan: 2026-10-30-caravan-survival-and-gameplay-adjustments
Phase: P01-survival-collision-and-hud
Task: T03-road-hud-and-monster-collision

- Lower the road and reserve space around the pause control
- Keep enemy movement outside the wagon collision footprint
```

## Progress
- [x] Implementation complete
- [x] Validation passed (web typecheck and build; no browser playtest available in this execution)
- commit: skipped due to pre-existing overlapping worktree changes; no files staged
