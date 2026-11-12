# Task: T01 Enemy HP Scaling

## Status: pending

## Goal
Give the ghoul 10 base HP, the Imp 8 base HP, and the Golden Imp 20 base HP; calculate each ordinary enemy and boss's HP at the moment it spawns from its base HP, the current player level, and the current fractional elapsed minutes.

## Decision Summary
- Use `Math.ceil(baseHp * (1 + (playerLevel - 1) * 0.15 + elapsedSeconds / 60 * 0.15))`, clamping invalid/negative level and time inputs to safe minima.
- Apply this to wagon-priority enemies and reward enemies as well as ordinary enemies and bosses. The old 150-second delay and 120-second step are removed.
- Rename `fortune-wraith` to `golden-imp`; restore old `fortune-wraith` save entries as `golden-imp` so old saved runs continue to load.

## Implementation

### I01. Enemy base data and progression calculation

- Related Files:
  - `apps/web/src/game/content/enemies.ts` :: `basic`, `enemyCatalog` — define requested base HP and reward enemy ID; modify.
  - `apps/web/src/game/systems/EnemyProgression.ts` :: `scaledEnemyHp`, `enemyForSpawnRoll` — continuous level/time calculation and current reward selection; modify.
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy` — use the existing reward asset and gold death tint for `golden-imp`; modify.
  - `apps/web/src/game/test/EnemyProgression.test.ts` :: existing `scaledEnemyHp` and reward-roll expectations — keep compile-time fixtures aligned with the changed signature, values, and ID; modify existing cases only.
  - `apps/web/src/game/test/EnemyCatalog.test.ts` :: existing enemy-role expectations — update the ghoul and Imp base HP fixtures; modify existing cases only.

#### Details
- **Signatures & Types**:
  ```typescript
  export function scaledEnemyHp(baseHp: number, elapsedSeconds: number, playerLevel: number | boolean): number;
  ```
- **Data & Schema Fields**:
  - Ghoul `keep-ghoul`: `maxHp: 10`.
  - Standard flying Imp `imp`: `maxHp: 8`.
  - Reward enemy `golden-imp`: `maxHp: 20`, `rewardMonster: true`; retain current reward frequency, speed, target policy, XP/gold handling, and reward pickup behavior.
  - No contract or save schema changes. Legacy saved type ID `fortune-wraith` is accepted during restore.
- **Execution Flow / Logic**:
  1. Normalize `playerLevel` to at least 1 and `elapsedSeconds` to at least 0.
  2. Calculate `Math.ceil(baseHp * (1 + (normalizedLevel - 1) * 0.15 + normalizedElapsedSeconds / 60 * 0.15))`.
  3. Remove the old `wagonPriority` and first-150-seconds bypasses; do not round elapsed minutes before applying the rate.
  4. Keep `enemyForSpawnRoll` reward probability and ordinary selection ratios unchanged, substituting the renamed reward record.
  5. In `Enemy`, continue loading `/game-assets/monsters/fortune-wraith.png` for reward enemies (existing art remains in use), and select gold hit/death tint by `rewardMonster` or the new ID rather than the old ID.

### I02. Apply scaling on every creation and restore path

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `spawnEnemy`, `startBoss`, `enemyDefinition`, snapshot restoration — pass current player level and elapsed time on all enemy paths; modify.
  - `apps/web/src/game/systems/BossDirector.ts` :: `startBoss` — accept an HP scale or explicit scaled max HP so the returned boss definition and internal initial HP both use the scaled HP; modify.

#### Details
- **Signatures & Types**:
  ```typescript
  startBoss(bossId: string, run: RunState, hpScale?: number): BossDefinition | null;
  ```
- **Execution Flow / Logic**:
  1. `spawnEnemy` scales every selected catalog entry, including `rewardMonster`, with `run.elapsedSeconds` and `run.level`.
  2. `startBoss` calls the same HP formula on the chosen boss catalog's `maxHp`, then supplies the resulting ratio to `BossDirector.startBoss`; the returned definition and director's initial state must agree.
  3. Snapshot restoration scales saved enemy definitions with `snapshot.elapsedSeconds` and `snapshot.player.level`, then clamps the saved current HP to the newly computed maximum as existing restoration does.
  4. When restoring a saved active boss, initialize `BossDirector` with the saved `activeBoss.maxHp` ratio relative to the catalog base before synchronizing current HP. Do not scale an already-scaled saved maximum a second time.
  5. Map `fortune-wraith` to `golden-imp` in `enemyDefinition` for legacy snapshots; new snapshots write `golden-imp`.
- **Validation Note**: Update existing test expectations to the new API and values, but do not add test cases or execute the test suite under the current instruction. Typecheck/build still compile the test source files.

## Acceptance Criteria
- [ ] Base HP values are ghoul 10, Imp 8, Golden Imp 20.
- [ ] HP scaling is continuous by elapsed second and changes at every spawn, including at 0 seconds and before 150 seconds.
- [ ] Player level and elapsed time both affect all enemy types, including wagon-priority, reward, miniboss, and final boss spawns.
- [ ] Restoring legacy reward enemy saves does not fail, and an active scaled boss restores without multiplying its saved maximum again.
- [ ] Reward chance, rewards, and enemy movement/target behavior remain unchanged.
- [ ] Existing progression/catalog test fixtures compile with the new signature and enemy values; the test suite itself is not run.

## Validation
- `npm run typecheck --workspace @caravan/web` — web TypeScript compilation succeeds.
- `npm run build --workspace @caravan/web` — production web build succeeds.
- Do not add or run tests unless the user asks.

## Commit Message
```text
feat(game): scale enemy hp by level and time

Plan: 2026-10-30-caravan-enemy-scaling-map-expansion
Phase: P01-enemy-scaling-and-arena
Task: T01-enemy-hp-scaling

- Set ghoul, Imp, and Golden Imp base HP
- Scale every enemy and boss at spawn and restore legacy reward IDs
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- commit: pending
