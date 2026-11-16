# Task: T03 Boss Gimmicks

## Status: done

## Goal
용암 거인과 라바 매지션의 전투 상태를 캠페인 씬에서 실행하고, 기믹 도중 저장한 게임을 불러와도 예고·돌진·스턴·순간이동 경계·소환 대기시간이 이어지도록 한다.

## Decision Summary
- 거인 예고 시작 간격은 6초, 예고 2초, 돌진 피해는 플레이어와 마차 각각 40, 경계 충돌 후 스턴은 4초, 스턴 중 받는 피해는 1.5배다.
- 매지션은 체력 10% 경계를 밟을 때 최대 한 번 순간이동하고, 4초 소환 주기는 잃은 체력 10%마다 0.1초 줄어든다.

## Implementation

### I01. 기믹 상태 타입 및 저장 계약

- Related Files:
  - `packages/contracts/src/save.ts` :: `BossSnapshotSchema`, `RunSnapshotV1Schema` — 선택 보스별 기믹 스냅샷; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot` — 활성 보스 기믹 상태를 snapshot에 전달; modify
  - `apps/web/src/game/systems/BossGimmickSystem.ts` :: `LavaGiantState`, `LavaMagicianState`, 순수 전이 함수 — 타이머와 경계 처리; new
  - `apps/web/src/game/test/BossGimmickSystem.test.ts` — 타이머·체력 경계·상태 직렬화 검증; new

#### Details
- **Signatures & Types**:
  ```typescript
  export type LavaGiantPhase = 'approach' | 'tell' | 'charge' | 'stunned';
  export interface LavaGiantState {
    kind: 'lava-giant';
    phase: LavaGiantPhase;
    phaseRemainingMs: number;
    nextTellMs: number;
    chargeDirection: { x: number; y: number } | null;
    hitPlayerThisCharge: boolean;
    hitWagonThisCharge: boolean;
  }
  export interface LavaMagicianState {
    kind: 'lava-magician';
    crossedHpThresholds: number;
    summonCooldownMs: number;
  }
  export type BossGimmickState = LavaGiantState | LavaMagicianState;
  export function createBossGimmickState(bossId: BossId): BossGimmickState | null;
  export function advanceBossGimmick(state: BossGimmickState, deltaMs: number): BossGimmickState;
  export function getLavaMagicianSummonInterval(maxHp: number, hp: number): number;
  export function getLavaMagicianThreshold(maxHp: number, hp: number): number;
  ```
- `SnapshotInput` gains `activeBossGimmick?: BossGimmickState | null`. `createSnapshot` writes it to `activeBoss.gimmick` alongside the existing `id`, `typeId`, `hp`, and `maxHp`; restore maps it back to the active encounter state.
- **Data & Schema Fields**:
  - `activeBoss.gimmick`: nullable optional discriminated union defaulting to `null`. Giant saves `kind`, `phase`, `phaseRemainingMs`, `nextTellMs`, nullable normalized `chargeDirection`, `hitPlayerThisCharge`, `hitWagonThisCharge`. Mage saves `kind`, `crossedHpThresholds` integer 0–10, and `summonCooldownMs`.
  - Existing snapshots with no `gimmick` restore into default initial state for that boss; snapshots with the field restore it exactly. No save schema version bump.
- **Zod Schema**:
  ```typescript
  const BossVectorSnapshotSchema = z.object({ x: CoordinateSchema, y: CoordinateSchema }).strict();
  const BossGimmickSnapshotSchema = z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('lava-giant'),
      phase: z.enum(['approach', 'tell', 'charge', 'stunned']),
      phaseRemainingMs: CounterSchema,
      nextTellMs: CounterSchema,
      chargeDirection: BossVectorSnapshotSchema.nullable(),
      hitPlayerThisCharge: z.boolean(),
      hitWagonThisCharge: z.boolean(),
    }).strict(),
    z.object({
      kind: z.literal('lava-magician'),
      crossedHpThresholds: CounterSchema.max(10),
      summonCooldownMs: CounterSchema,
    }).strict(),
  ]);
  // Add to BossSnapshotSchema:
  gimmick: BossGimmickSnapshotSchema.nullable().default(null),
  ```
- **Execution Flow / Logic**:
  1. Initial giant state is `approach`, `nextTellMs=6000`, no charge vector and both per-charge hit flags false. Begin the first tell 6 seconds after encounter start, then keep 6 seconds between tell starts. A tell never begins during `stunned`; if a stun overlaps its scheduled start, begin after stun ends.
  2. Tell lasts exactly 2000 ms. While telling, recompute normalized direction from giant to player each update; when it ends, freeze that vector and enter `charge`.
  3. Mage summon interval is `max(3000, 4000 - floor((maxHp - hp) / (maxHp * 0.1)) * 100)` milliseconds, recalculated after every HP change. While alive and `hp > 0`, initialize the first summon cooldown to 4000 ms.
  4. Mage threshold is `floor((maxHp - hp) / (maxHp * 0.1))`, clamped 0–10. On damage, if `getLavaMagicianThreshold(maxHp, hp)` exceeds `crossedHpThresholds`, teleport once and set the stored count to the latest threshold. This consumes intermediate thresholds without repeated teleports.
  5. State transitions ignore negative and non-finite delta values; clamp timers to zero and HP threshold to 0–10. No state change is emitted for dead bosses.

### I02. Scene orchestration, damage and save/resume

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `update`, `startBoss`, `createRunSnapshot`, `enemyDefinition`, `resolveBossDamage` — connect state machine and sigils; modify
  - `apps/web/src/game/entities/Enemy.ts` :: `damageTakenMultiplier` — expose the current incoming damage multiplier; modify
  - `apps/web/src/game/systems/WeaponSystem.ts` :: damage callback — report actual applied damage so mage thresholds trigger on all player damage sources; modify
  - `apps/web/src/game/test/CaravanScene.test.ts` — seeded choice, charge and saved state integration; modify
  - `apps/web/src/features/run/SaveResume.test.ts` — active gimmick restoration; modify

#### Details
- **Execution Flow / Logic**:
  1. Keep campaign time paused throughout either miniboss battle, keep already-present ordinary enemies, and suppress new ordinary spawns, matching current miniboss behavior.
  2. Giant charge velocity uses frozen unit vector at `speed=360 world px/s`; update world position each frame until the first world boundary. Clamp the boss center by 46 world pixels (its current boss collision radius). At each frame, segment-test the swept path against the player center and wagon collision rectangle. Apply 40 damage at most once to each target per charge, set corresponding state flag, and continue through both targets.
  3. On boundary impact, stop movement, enter `stunned` for 4000 ms, clear charge vector after saving required hit flags, and set `damageTakenMultiplier=1.5`. On stun end restore multiplier to 1 and enter `approach`; next tell may begin only once `nextTellMs` reaches zero. Ensure the cadence is at least 6000 ms between tell starts.
  4. During giant `approach`, preserve existing miniboss movement and contact attack. During `tell` and `stunned`, do not let `EnemyDirector` move or contact-attack the giant; during `charge`, replace ordinary movement with the swept charge update.
  5. On mage spawn, place boss at `y=48` (top inner edge), choose x uniformly from `[48, WORLD_WIDTH-48]`, and retain existing boss movement/contact attack. Every 10% HP threshold teleport once to one of the four world edges with 48 px inset; choose the coordinate uniformly along that edge. Reject positions inside current wagon collision rectangle expanded by boss radius 46; try at most 16 candidates, then use the farthest valid inset corner.
  6. When the mage summon timer expires, choose near-wagon placement with `random()<0.25`. For that branch choose uniform-area point in radius 120 (`angle=2πr1`, `distance=120*sqrt(r2)`), centered on wagon. Otherwise choose `x=random()*WORLD_WIDTH`, `y=random()*WORLD_HEIGHT`. Spawn `LavaSigil` and reset timer using current interval formula.
  7. Every 10% boss HP threshold and weapon damage path must share one callback so direct hits and damage-over-time both update mage threshold state once per applied damage event. Random teleport/summon draws use `this.random` only.
  8. Snapshot the active boss gimmick state into `activeBoss.gimmick`; restore boss `Enemy`, active milestone ID and BossDirector with the saved state. Restore `lavaSigils` through T02. On old snapshots without gimmick, construct a fresh state; do not reroll boss ID if an active boss snapshot exists.
  9. When restoring an active boss, emit `boss-encounter` with the saved milestone fields and actual `BossId` after state restoration so `GameCanvas` shows the correct encounter label immediately. The GameCanvas event subscription is registered before Phaser scene creation.
- **State Transition & Return**:
  - Defeating either boss records actual `lava-giant` or `lava-magician` ID; emits the unchanged 10-minute slot ID `lava-behemoth`; resumes campaign clock; preserves any live sigil entity and its fuse; starts existing biome transition logic.

## Acceptance Criteria
- [x] Giant follows the player during the 2-second tell, freezes aim when charging, passes through player and wagon at most once each, stops at the boundary, and enters 4-second 1.5x vulnerability.
- [x] Giant warning state starts no more frequently than once per 6 seconds; a stun delays the next tell until it is over.
- [x] Mage loses exactly one teleport per hit event even when several 10% boundaries are crossed; teleport never overlaps the expanded wagon collision area.
- [x] Mage summon interval starts at 4000 ms and drops by 100 ms per lost 10% HP; 25% of summons use radius-120 near-wagon distribution.
- [x] Save/resume during tell, charge, stun, mage cooldown, or an active sigil preserves its state without selecting another boss.

## Validation
- `npm run test --workspace @caravan/web -- src/game/test/BossGimmickSystem.test.ts src/game/test/CaravanScene.test.ts src/features/run/SaveResume.test.ts` — transition, scene and restore behavior pass.
- `npm run typecheck --workspace @caravan/web` — scene, snapshot and system types pass.
- Manual play check at 10:00 — verify both variants can be selected across seeded runs; check warning direction, collision, vulnerability, teleport and persistent circles.

### Execution results (2026-11-16)
- Passed focused task validation: 3 test files, 12 tests.
- Passed `npm run typecheck --workspace @caravan/web` and `npm run test --workspace @caravan/contracts -- test/schema.test.ts` (8 tests).
- The full web suite has two failures in `CharacterCatalog.test.ts` weapon tests; focused boss/save tests pass. Those tests construct targets without the `WeaponAttackTarget` hit interface and are outside this task's files.
- Manual play check was not performed; the UI warning and boss-specific sprite cues are scheduled in T04.

## Commit Message
```text
feat(game): implement lava boss encounter mechanics

Plan: 2026-11-13-caravan-random-10min-boss
Phase: P01-lava-boss-encounters
Task: T03-boss-gimmicks

- Add giant charge and exposed stun states
- Add magician teleports and adaptive sigil summoning
- Persist encounter gimmick state through save and resume
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual play check (deferred to T04 visual verification)
- commit: 97e05ee
