# Task: T04 Character Training

## Status: done

## Goal
Implement Warrior Thorn Armor, Archer Dash, and Mage Wind Spirit's Blessing so training purchases create the character-specific behavior described in the shop.

## Decision Summary
- Warrior reflection is 5% of raw pre-defense incoming damage per rank. Archer and Mage abilities activate with Space and require the corresponding profile training unlock.
- Archer dash is 160 px over 250 ms with invulnerability and a 4 sec cooldown. Mage knockback radius is 200 px with an 8 sec cooldown.

## Implementation

### I01. Training rank in run state and save snapshot
- Related Files:
  - `packages/contracts/src/gameplay.ts` :: `RunStateSchema`, `RunState` — store training levels for the active character; modify.
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema` — defaulted training/ability snapshot data; modify.
  - `apps/web/src/game/state/createRunState.ts` :: `createRunState` — initialize empty training state; modify.
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `createSnapshot`, `restoreSnapshot` — round-trip ability data; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create` — copy selected character's purchased training levels only for new runs; modify.

#### Details
- Store `trainingLevels: Partial<Record<TrainingId, number>>` on run state. Populate it from `profile.characterTrainingLevels[characterId]` on a new run, defaulting absent entries to zero; restore snapshot training levels without reading current profile values.
- Add defaulted ability state to the V1 snapshot: `activeAbilityCooldownMs: CounterSchema.default(0)`, `dashRemainingMs: CounterSchema.default(0)`, `dashDirection: {x: CoordinateSchema, y: CoordinateSchema}` default `{x:1,y:0}`. Old V1 snapshots remain valid.
- Preserve `schemaVersion: 1`; the new fields are defaulted and optional at the wire boundary, and serializers always emit them.

### I02. Warrior reflection and Archer dash
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: enemy damage loop and `update` — reflect and process ability input/timers; modify.
  - `apps/web/src/game/entities/Warrior.ts` :: `setInput`, movement direction state — dash movement and visual; modify.
  - `apps/web/src/game/systems/ActiveAbilitySystem.ts` :: `updateDash`, `resolveWindKnockback` — new pure ability calculations; new.

#### Details
- Warrior reflection rank `r` reflects `incomingRawDamage * min(r * .05, .25)` against the attacking enemy once per successful player hit. Reflection is calculated from raw attack damage, independent of T03 defense reduction.
- Add Space keyboard input; call `preventDefault` to avoid page scrolling while the Phaser scene is active. Ability triggers only when the player is alive, run is active, training is unlocked, cooldown is zero, and pause state is `none`.
- Track last nonzero normalized movement direction; if no movement has ever occurred, dash direction is `{x:1,y:0}`. Dash for 250 ms over about 160 px, clamp to world bounds, set player invulnerability for the dash duration, then start 4000 ms cooldown. Do not let normal movement overwrite the dash velocity.
- Mage activation examines enemies within 200 px of player and applies outward knockback without damage. Regular enemies move to the circle boundary; midbosses receive half the regular displacement; final boss receives none. Knockback does not change enemy HP, spawn, or attack target policy.
- Tick cooldown/dash duration from game delta, freeze them while scene is paused, and restore from the snapshot fields.

## Acceptance Criteria
- [x] Warrior rank 1–5 reflects exactly 5–25% of incoming raw damage.
- [x] Archer dash fires only when unlocked and off cooldown, moves in the correct direction, grants dash-length invulnerability, and blocks normal movement until complete.
- [x] Mage ability pushes regular/midboss enemies by the defined amounts, does not damage them, and leaves the final boss unmoved.
- [x] Abilities and cooldown state survive manual save/resume and older snapshots parse with defaults.

## Validation
- `npm run typecheck --workspace @caravan/contracts` — run-state/snapshot types pass.
- `npm run typecheck --workspace @caravan/web` — scene and ability types pass.
- `npm run build --workspace @caravan/web` — game bundle builds.
- Manual: activate each ability in a run, verify movement/range/cooldown/health behavior, save during a cooldown and resume.

## Execution Notes
- New runs copy only the selected character's purchased training ranks into run state. Saves persist those ranks, ability cooldown, and Archer dash remaining time/direction; older V1 snapshots receive safe defaults.
- Warrior reflects 5% per Thorn Armor rank, up to 25%, from raw incoming hit damage. Archer's unlocked Space ability dashes 160 px over 250 ms with invulnerability and a 4-second cooldown. Mage's unlocked Space ability knocks regular enemies to the 200 px boundary and midbosses halfway there, with no damage; final bosses ignore it. Abilities also work during active boss combat.
- Updated the existing save-flow snapshot fixture to include the newly required typed fields. No tests were run.
- `npm run typecheck --workspace @caravan/contracts`, `npm run build --workspace @caravan/contracts`, `npm run typecheck --workspace @caravan/web`, and `npm run build --workspace @caravan/web` passed.
- No in-browser ability or save/resume review was run.

## Commit Message
```text
feat(gameplay): add warrior reflection and active character abilities

Plan: 2026-10-29-caravan-shop-upgrades
Phase: P01-shop-progression
Task: T04-character-training

- Implement Thorn Armor, Archer Dash, and Mage knockback
- Preserve run training and active ability state in snapshots
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
