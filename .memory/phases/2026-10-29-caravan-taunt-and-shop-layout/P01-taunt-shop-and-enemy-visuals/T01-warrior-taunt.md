# Task: T01 Warrior Taunt Training

## Status: done

## Goal
Add a one-time 500 G passive Warrior training named `warrior-taunt`. When the Warrior has it unlocked, every wagon-priority enemy within 300 world pixels targets the Warrior; outside that radius it follows its existing target policy. Render a faint yellow radius circle around the living Warrior. Keep the current fallback in which enemies target the caravan when the Warrior is dead.

## Decision Summary
- Taunt is separate from the five-rank `warrior-thorn-armor` training and costs 500 G once (`kind: 'unlock'`, `maxLevel: 1`).
- The aura radius is 300 Phaser world pixels. The current enemy target refresh interval is 250 ms; use that refresh for both existing and newly spawned enemies.
- Only wagon-priority enemies are redirected. Do not redirect warrior-priority enemies or ordinary enemies already targeting the Warrior.
- No profile migration is expected: profiles store character training levels as a partial record keyed by the shared `TrainingId` schema.

## Implementation

### I01. Add the training ID and catalog definition
- Related Files:
  - `packages/contracts/src/profile.ts` :: `TrainingIdSchema`, add `'warrior-taunt'`; modify.
  - `packages/contracts/src/metaProgression.ts` :: `characterTrainingCatalog`, add the definition; modify.
  - `apps/web/src/features/progression/MetaShop.tsx` :: `trainingNames`, `trainingEffects`; add the display name and short effect so the `Record<TrainingId, string>` maps remain exhaustive. T02 owns rendering every card.

#### Details
- Add `'warrior-taunt'` to `TrainingIdSchema` and therefore the inferred `TrainingId` union.
- Add `characterTrainingCatalog['warrior-taunt']` with exact values `{ id: 'warrior-taunt', characterId: 'warrior', kind: 'unlock', maxLevel: 1, rankCosts: [500] }`.
- Add the shop map entries `'warrior-taunt': '도발'` and `'warrior-taunt': '범위 안의 마차 돌진 몬스터가 전사를 우선 공격합니다.'` to the corresponding `trainingNames` and `trainingEffects` records. Do not change shop structure in this task.
- Existing profile purchase validation must continue deriving valid IDs and costs from the shared catalog. Inspect existing generic consumers; do not add a one-off purchase path or migration.
- Korean display label: `도발`. Effect: `범위 안의 마차 돌진 몬스터가 전사를 우선 공격합니다.`

### I02. Redirect wagon-priority targets inside the aura
- Related Files:
  - `apps/web/src/game/systems/EnemyDirector.ts` :: `EnemyDirector.update`, `chooseTarget` call, target refresh; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: call to `enemyDirector.update` around line 322, training level hydration around line 113; modify.

#### Details
- Export `WARRIOR_TAUNT_RADIUS = 300` from `EnemyDirector.ts` and use it for both target logic and the scene aura.
- Extend `EnemyDirector.update(enemies, warrior, caravan, delta, warriorAvailable = true, tauntUnlocked = false)` by appending an optional boolean. Existing callers keep their old behavior until the scene passes the flag.
- Keep the existing 250 ms target refresh. On refresh, if the Warrior is available, Taunt is unlocked, `enemy.definition.wagonPriority === true`, and `distanceSquared(enemy.worldPosition, warrior) <= WARRIOR_TAUNT_RADIUS ** 2`, set target to `warrior`. Otherwise call the current `chooseTarget(enemy.worldPosition, warrior, caravan, enemy.definition.targetPolicy)` unchanged. If `warriorAvailable` is false, retain the current caravan fallback before checking Taunt.
- The branch must run on the normal refresh for every enemy, so existing enemies and newly spawned enemies behave identically. An enemy outside the radius resumes its configured target policy on its next refresh.
- Pass `this.run.characterId === 'warrior' && (this.run.trainingLevels['warrior-taunt'] ?? 0) >= 1` as `tauntUnlocked` in `CaravanScene.ts`.

### I03. Draw the unlocked Warrior's taunt radius
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: Phaser object creation/update and scene cleanup; modify.
  - `apps/web/src/game/systems/EnemyDirector.ts` :: exported `WARRIOR_TAUNT_RADIUS`; read-only.

#### Details
- Create a Phaser circle with radius `WARRIOR_TAUNT_RADIUS`, fill `0xffd84f` at alpha `0.10`, stroke `0xffd84f` at alpha `0.18` and width `2`.
- Place it below Warrior and enemy sprites; follow the Warrior's current world position each frame. Show it only for a Warrior run with Taunt level >= 1 and a living Warrior. Hide it when locked or dead. Ensure normal scene destruction disposes it.
- Use the exported radius constant so the visible boundary and target check cannot diverge. Existing profile hydration already copies selected character training levels into `this.run.trainingLevels`; no save format change is needed.

### I04. Confirm generic 500 G purchase behavior
- Related Files:
  - `apps/api/src` :: existing training purchase handler/service that consumes `characterTrainingCatalog`; read-only unless a hard-coded training allow-list is found.
  - `apps/web/src/features/progression/MetaShop.tsx` :: `purchaseTraining`; read-only for this task.

#### Details
- Inspect the current generic training purchase path. If a handler hard-codes the existing IDs, replace only that validation with catalog-derived validation, preserving existing response/error semantics.
- Buying the unlock deducts exactly 500 G and records level 1 under `characterTrainingLevels.warrior['warrior-taunt']`; another purchase is rejected as capped/already owned by current generic validation.
- Keep all other training costs, ranks, and effects unchanged.

## Acceptance Criteria
- [x] `warrior-taunt` parses as a valid `TrainingId`; old profiles missing this key remain valid.
- [x] Catalog metadata defines Taunt as a one-time Warrior unlock costing exactly 500 G.
- [x] Unlocked Taunt redirects wagon-priority enemies within 300 px on the existing refresh; outside the circle they use their original target policy.
- [x] Both pre-existing and newly spawned enemies are affected; dead-Warrior fallback remains caravan targeting.
- [x] A yellow, high-transparency 300 px circle appears only for a living Warrior with Taunt unlocked and follows that Warrior.
- [x] Other enemy policies, Thorn Armor reflection, and non-Warrior characters remain unchanged.

## Validation
- `npm run typecheck --workspace @caravan/contracts` — shared schema and catalog typecheck.
- `npm run build --workspace @caravan/contracts` — refresh workspace package output consumed by web/API.
- `npm run typecheck --workspace @caravan/web` — validate scene/system integration.
- Manual play check: unlock Taunt; confirm a wagon-priority rusher/flier redirects inside the circle and returns to caravan priority outside; inspect locked, unlocked, and dead-Warrior states.

## Commit Message
```text
feat(game): add warrior taunt training

Plan: 2026-10-29-caravan-taunt-and-shop-layout
Phase: P01-taunt-shop-and-enemy-visuals
Task: T01-warrior-taunt

- Add the one-time 500 G Warrior Taunt catalog entry
- Redirect nearby wagon-priority enemies and show its range
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
