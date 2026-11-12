# Task: T01 Revive Presentation

## Status: done

## Goal
Restore half maximum HP after a revive, show a winged heart per remaining revive charge below the upper-left HP bar, and play a descending light beam when the player revives.

## Target Files
- `apps/web/src/game/systems/RespawnSystem.ts` :: `RespawnSystem.update` — set revived HP to `Math.ceil(maxHp / 2)`.
- `apps/web/src/game/scenes/CaravanScene.ts` :: HUD creation/refresh and revive branch in `update` — create, reconcile, and remove winged heart markers; invoke the revive beam on successful revival.
- `apps/web/src/game/test/SurvivalRules.test.ts` :: existing full-health revive expectation — update fixture expectation to half HP; do not run tests.

## Acceptance Criteria
- [x] A successful revive restores `ceil(maxHp / 2)` HP.
- [x] The HUD displays exactly one winged heart per remaining revive charge below the upper-left health bar.
- [x] A consumed revive charge removes one heart on the next HUD refresh.
- [x] A descending light beam appears at the player only when the revival completes and cleans itself up.
- [x] Existing five-second countdown and two-second invulnerability remain intact.

## Validation
- `npm run typecheck --workspace @caravan/contracts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`
- Do not run the test suite.

## Commit Message
```text
feat(game): clarify limited player revives

Plan: 2026-10-30-caravan-revive-presentation
Phase: P01-revive-presentation
Task: T01-revive-presentation

- Restore half health and show remaining winged-heart lives
- Add a descending light effect when the player revives
```

## Progress
- [x] Implementation complete
- [x] Validation passed (contracts/web typecheck and web build)
- commit: skipped due to pre-existing overlapping worktree changes; no files staged
