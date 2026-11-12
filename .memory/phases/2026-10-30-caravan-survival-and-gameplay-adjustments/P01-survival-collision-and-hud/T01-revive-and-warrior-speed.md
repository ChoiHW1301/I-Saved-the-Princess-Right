# Task: T01 Revive State and Warrior Attack Speed

## Status: done

## Goal
Make player revives finite and persistent through saves, start each new run with the number granted by the purchased upgrade (0–3), wait five seconds per revival, end the run on death when no charges remain, and slow Warrior's basic sword attack to one strike every 1500 ms.

## Decision Summary
- `respawnsRemaining` is a nonnegative run-state field. A new run initializes it from the permanent `extra-lives` rank; a resumed run restores its saved remaining count without regranting charges.
- On lethal damage, consume one charge and set 5000 ms; with zero charges leave the player dead and mark the run lost. Successful revival keeps existing full-HP restoration and 2000 ms invulnerability.
- Countdown seconds are displayed below the karma gauge only while a charged revival is pending.

## Implementation

### I01. Run state and save compatibility

- Related Files:
  - `packages/contracts/src/gameplay.ts` :: `PlayerRunStateSchema`, `PlayerRunState` — add `respawnsRemaining: nonnegative integer`; modify.
  - `packages/contracts/src/save.ts` :: `PlayerSnapshotSchema` — persist `respawnsRemaining` with default `0` for legacy saves; modify.
  - `apps/web/src/game/state/createRunState.ts` :: `createRunState` — initialize revive charges to `0`; modify.
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot`, `restoreSnapshot` — persist/restore charges and existing `respawnMs`; modify.
  - `apps/web/src/game/systems/MetaProgression.ts` :: `applyPermanentUpgrade` — apply `extra-lives` rank only when initializing a fresh run; modify.

#### Details
- **Data & Schema Fields**:
  - `PlayerRunState.respawnsRemaining: number` — integer >= 0.
  - `RunSnapshotV1.player.respawnsRemaining: CounterSchema.default(0)` — legacy snapshots without the property parse as zero.
- **Execution Flow / Logic**:
  1. Fresh run: `createRunState` returns zero charges; `CaravanScene.create` then applies the profile's permanent extra-life rank to this field.
  2. Resume: `restoreSnapshot` uses the saved number. Do not reapply current profile rank to an existing saved run.
  3. Snapshot: write current `respawnsRemaining` alongside `respawnMs`; restoring a mid-countdown run preserves the exact remaining milliseconds.
  4. Preserve all other player profile and save fields unchanged.

### I02. Death, revival, countdown, and sword interval

- Related Files:
  - `apps/web/src/game/systems/HealthSystem.ts` :: `damagePlayer` — consume one revive charge on lethal damage; set five-second timer only when a charge exists; modify.
  - `apps/web/src/game/systems/RespawnSystem.ts` :: `update` — count down and restore the player at zero; retain full HP and two-second invulnerability; modify only if needed.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `update`, `refreshHud`, HUD creation, damage handling — initialize fresh-run charges, set run lost when death occurs with no charge, show countdown text below karma, hide it while alive; modify.
  - `apps/web/src/game/content/weapons.ts` :: `weaponCatalog.sword.intervalMs` — change 1250 to 1500; modify.
  - `apps/web/src/game/test/SurvivalRules.test.ts` :: existing player-death fixture/assertions — align expected death timer/charge state; modify existing test only, do not run it.

#### Execution Flow / Logic
1. On lethal damage, if `respawnsRemaining > 0`, decrement exactly once, set `isDead=true`, set `respawnMs=5000`; otherwise set `isDead=true`, `respawnMs=0`.
2. In `CaravanScene`, if lethal damage leaves `respawnsRemaining===0` and `respawnMs===0`, mark `run.status='lost'`; do not show a countdown.
3. If `respawnMs > 0`, update it while the scene continues. The countdown label reads `Math.ceil(respawnMs / 1000)` seconds below the karma gauge.
4. When `RespawnSystem.update` returns true, restore visibility/body as current code does; it restores max HP and 2000 ms invulnerability. Hide the label on the same update.
5. Set sword `intervalMs: 1500`; leave other weapons and global attack speed upgrades unchanged.

## Acceptance Criteria
- [x] New runs start at zero charges without the upgrade; rank N grants N charges, capped at three.
- [x] A charged death consumes one charge and revives after five seconds at full HP with two seconds of invulnerability.
- [x] Death with zero charges ends the run without a countdown.
- [x] Countdown appears below karma during the pending revival and disappears on revive/loss.
- [x] Saving/resuming mid-countdown preserves time and remaining charges; legacy snapshots default safely to zero.
- [x] Warrior sword base interval is 1500 ms; other weapons are unchanged.

## Validation
- `npm run typecheck --workspace @caravan/contracts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`
- Do not execute the test suite.

## Commit Message
```text
feat(game): add limited player revives

Plan: 2026-10-30-caravan-survival-and-gameplay-adjustments
Phase: P01-survival-collision-and-hud
Task: T01-revive-and-warrior-speed

- Persist per-run revive charges and a five-second countdown
- Slow the Warrior's base sword interval to 1500 ms
```

## Progress
- [x] Implementation complete
- [x] Validation passed (contracts/web typecheck and build)
- commit: skipped due to pre-existing overlapping worktree changes; no files staged
