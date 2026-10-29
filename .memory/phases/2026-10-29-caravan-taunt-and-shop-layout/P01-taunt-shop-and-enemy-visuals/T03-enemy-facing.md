# Task: T03 Enemy Facing by Movement

## Status: done

## Goal
Make each enemy body sprite face the horizontal direction its container moves. Preserve its last facing while stationary or moving only vertically.

## Decision Summary
- Flip the body image only; do not mirror the enemy container, shadow, position, hitbox, or death particles.
- Positive horizontal displacement faces right; negative displacement faces left; zero preserves the last facing.
- Apply through the shared movement path to regular enemies and bosses.

## Implementation

### I01. Expose a body-sprite facing method
- Related Files:
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy.bodyImage`, add public `setFacingDirection(horizontalDelta: number): void`; modify.

#### Details
- Add a public method that updates only `bodyImage.setFlipX(...)` for non-zero horizontal deltas.
- `horizontalDelta > 0` calls `setFlipX(false)` (faces right); `< 0` calls `setFlipX(true)` (faces left); exactly zero performs no change.
- Do not flip shadow or other container children. Preserve hit flash, death sprite, boss decoration, tint, and flying bob tween behavior.

### I02. Set facing from actual movement
- Related Files:
  - `apps/web/src/game/systems/EnemyDirector.ts` :: `EnemyDirector.update`; modify.
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy.setFacingDirection`; use.

#### Details
- Before the existing target movement step, retain enemy world `x`; after applying that step, call `enemy.setFacingDirection(newX - oldX)`.
- Use actual per-frame horizontal displacement after speed/delta calculation, not target direction, so sprite orientation represents movement.
- Apply to every enemy moved by the shared director, including bosses, fliers, and wagon-priority enemies. Stationary or vertical movement retains the prior flip.
- Do not change steering, target selection, movement speed, collision, damage, or target refresh timing.

## Acceptance Criteria
- [x] Right-moving enemies show unflipped body sprites; left-moving enemies show flipped body sprites.
- [x] Stationary enemies and vertically moving enemies preserve their last horizontal facing.
- [x] Shadow, container position, collision area, attacks, and death effects are not mirrored or otherwise changed.
- [x] Regular enemies, fliers, wagon rushers, and bosses share the behavior.

## Validation
- `npm run typecheck --workspace @caravan/web` — validate entity/director API usage.
- `npm run build --workspace @caravan/web` — verify production build.
- Automated validation passed. Manual play check was unavailable because this environment exposed no browser tab; confirm left/right/vertical movement orientation during the next local play session.

## Commit Message
```text
feat(game): face enemies toward movement

Plan: 2026-10-29-caravan-taunt-and-shop-layout
Phase: P01-taunt-shop-and-enemy-visuals
Task: T03-enemy-facing

- Flip enemy body sprites using horizontal movement
- Preserve facing while stationary or moving vertically
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed
- commit: pending
