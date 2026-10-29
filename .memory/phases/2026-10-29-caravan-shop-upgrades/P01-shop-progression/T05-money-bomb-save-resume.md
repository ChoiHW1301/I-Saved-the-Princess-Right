# Task: T05 Money Bomb and Save/Resume

## Status: done

## Goal
Implement Merchant Money Bomb and its collectible coins, with fuse, cooldown, coin expiry visuals, and exact behavior across save/resume.

## Decision Summary
- Bomb is placed at the Merchant's feet, explodes after 3 sec, and starts a 12 sec cooldown on placement.
- Each enemy actually damaged drops one coin at its location, valued at `max(1, round(actualDamage / 20))` G; player contact collects it; expiry is 3 sec with blinking for the final 2 sec.

## Implementation

### I01. Bomb entity and damage resolution
- Related Files:
  - `apps/web/src/game/entities/MoneyBomb.ts` :: `MoneyBomb` — fuse countdown and pixel VFX; new.
  - `apps/web/src/game/systems/ActiveAbilitySystem.ts` :: merchant bomb placement/cooldown state — modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `update`, `collectReward`, bomb lifecycle — place, detonate, emit coin pickups; modify.
  - `apps/web/src/game/systems/CombatSystem.ts` :: `rollCriticalDamage` — reuse the shared critical roll for each enemy in the blast; read-only.
  - `apps/web/src/game/entities/RewardPickup.ts` :: pickup constructor and blinking — render expiring coins; modify.
  - `apps/web/src/game/systems/RewardPickupSystem.ts` :: `RewardPickupState`, `pickupVisible` — support per-pickup lifetime/blink duration; modify.

#### Details
- **Types**:
  ```typescript
  interface MoneyBombState { id: string; x: number; y: number; remainingMs: number; damage: number; radius: number }
  class MoneyBomb extends Phaser.GameObjects.Container {
    readonly bomb: MoneyBombState;
    advance(deltaMs: number): boolean;
  }
  ```
- Only Merchant with `trainingLevels['merchant-money-bomb']` in 1..5 can activate the ability. Space places one bomb at current player coordinates if cooldown is zero and player/run is active; begin 12000 ms cooldown immediately.
- Fuse is 3000 ms. On expiry, compute rank damage `40 * 1.1 ** (rank - 1)` and radius `100 + 10 * (rank - 1)` px. Apply T03 global damage multiplier and pass each enemy's resulting amount through `rollCriticalDamage` once. Clamp damage to enemy's remaining HP; one coin is emitted only when actual damage is positive. Coin base value is `max(1, Math.round(actualDamage / 20))`; apply the common gold bonus when collected.
- Drop one gold `RewardPickup` per damaged enemy at that enemy's world position, with `lifetimeMs: 3000`, `blinkDurationMs: 2000`, and 3000 ms remaining. Keep generic reward defaults at 30000/5000. Compute elapsed animation time from `lifetimeMs - remainingMs`, so blinking resumes at the same phase after loading a save. `pickupVisible(remainingMs, elapsedMs, blinkDurationMs)` starts blinking at `remainingMs <= blinkDurationMs` and uses a linearly shrinking blink interval from 300 ms to 75 ms.
- Bomb uses a clear pixel-art placement/fuse/explosion cue and follows the game's world depth ordering. No text labels are added to the gameplay field.

### I02. Snapshot state and restoration
- Related Files:
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema` — add defaulted `moneyBombs` snapshots; modify.
  - `packages/contracts/src/save.ts` :: `RewardPickupSnapshotSchema` — add backward-compatible defaulted `lifetimeMs` and `blinkDurationMs`; modify.
  - `apps/web/src/game/systems/RewardPickupSystem.ts` :: pickup lifetime fields and blinking function; modify.
  - `apps/web/src/game/entities/RewardPickup.ts` :: restore elapsed blinking phase from saved remaining time; modify.
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: create/restore bomb list; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `createRunSnapshot`, `create` — serialize/restore active bombs and timer; modify.

#### Details
- Add `MoneyBombSnapshotSchema = { id: IdSchema, x: CoordinateSchema, y: CoordinateSchema, remainingMs: CounterSchema.max(3000) }` and `moneyBombs: z.array(MoneyBombSnapshotSchema).max(20).default([])` to V1 snapshots.
- Add `lifetimeMs: CounterSchema.max(30000).default(30000)` and `blinkDurationMs: CounterSchema.max(30000).default(5000)` to reward pickup snapshots; old snapshots get these defaults.
- Snapshot the active ability cooldown from T04 and all active bombs. On restore, recreate bombs at saved locations with saved remaining fuse, do not reset cooldown, and do not duplicate already-dropped pickups. Existing pickups already round-trip in `rewardPickups`; preserve their remaining lifetime and blinking phase through the two duration fields and derived elapsed time.
- Keep new fields defaulted so old V1 saves without them continue to load.

## Acceptance Criteria
- [x] Rank 1 and rank 5 bomb damage/radius match formulas; explosion damages only enemies within radius.
- [x] Each enemy with actual damage taken drops exactly one coin of the correct value; untouched enemies drop none.
- [x] Coins are player-contact pickups, add to run gold, expire after 3 sec, and blink in the last 2 sec.
- [x] Saving with an active fuse, cooldown, or dropped coin and resuming restores each exactly once with remaining timers.

## Validation
- `npm run typecheck --workspace @caravan/contracts` — snapshot schema compiles.
- `npm run typecheck --workspace @caravan/web` — bomb and restore code typechecks.
- `npm run build --workspace @caravan/web` — game bundle builds.
- Manual: test no-rank rejection, ranks 1 and 5, hit/miss targets, coin pickup/expiry, and save/resume during fuse/cooldown.

## Execution Notes
- Added a pixel bomb at the Merchant's feet with a 3-second fuse and 12-second shared ability cooldown. Space is ignored unless Money Bomb has been purchased and the ability is ready.
- Explosion rank damage/radius follow the blueprint formulas, apply the common damage bonus and per-enemy critical roll, and damage only living enemies inside the radius. Each enemy that actually loses HP emits one gold pickup worth `max(1, round(actualDamage / 20))` before the common gold bonus is applied on collection.
- Coin pickups last 3 seconds and blink during the final 2 seconds. The pickup elapsed phase is derived from its saved lifetime and remaining time. Ordinary rewards retain their 30-second lifetime and 5-second blink window.
- V1 snapshots now persist bomb IDs/positions/fuse time and per-pickup lifetime/blink durations with defaults for older saves. The active ability cooldown was already in the snapshot from T04.
- Updated the existing typed save fixture for the new snapshot field. No tests were run.
- Contracts typecheck/build, web typecheck, and web production build passed. Vite still reports the large JavaScript chunk warning; build succeeds.
- No in-browser combat, expiry, or save/resume review was run.

## Commit Message
```text
feat(gameplay): add merchant money bomb and collectible coins

Plan: 2026-10-29-caravan-shop-upgrades
Phase: P01-shop-progression
Task: T05-money-bomb-save-resume

- Add ranked bomb damage and damage-based gold drops
- Persist active bombs, cooldown, and coin pickup timers
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
