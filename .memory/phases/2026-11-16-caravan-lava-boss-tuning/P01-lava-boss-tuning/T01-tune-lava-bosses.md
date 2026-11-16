# Task: T01 용암 보스 크기·기믹 조정

## Status: done

## Goal
용암 거인과 라바 매지션의 표시 크기를 두 배로 하고 용암 거인의 돌진 및 매지션의 고정 위치·마법진 기믹을 요청한 수치로 조정한다.

## Decision Summary
- 용암 보스 sprite x/y scale은 2.0이며 관련 hit radius와 edge inset은 92 world pixels다. 일반 보스와 일반 몬스터는 그대로 둔다.
- 거인 돌진은 1080 px/s. 매지션은 랜덤 화면 가장자리에서 정지하고, 피해 체력 10% 구간마다 기존대로 다른 가장자리로 이동한다.
- 마법진 HP 1; 소환 interval: 2000ms base, 50ms reduction per 10% HP threshold, 1500ms floor.

## Implementation

### I01. 용암 보스 표시·충돌 크기와 거인 속도

- Related Files:
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy.constructor`, `Enemy.hitRadius` — 지정 용암 보스 컨테이너 표시 비율과 피해 판정; modify
  - `apps/web/src/game/systems/BossGimmickSystem.ts` :: `LAVA_GIANT_CHARGE_SPEED`, `BOSS_COLLISION_RADIUS`, `getLavaGiantFacing` — 속도와 용암 보스 충돌/가장자리 반경; modify
  - `apps/web/src/game/systems/EnemyDirector.ts` :: `enemyRadius` — 몬스터-마차 회피에 사용할 용암 보스 반경; modify
  - `apps/web/src/game/test/EnemyDirector.test.ts` :: `enemy director fixed bosses` — 매지션이 추적 이동하지 않는지 확인; new
  - `apps/web/src/game/test/BossGimmickSystem.test.ts` :: `boss gimmick state` — constants and radius expectations; modify

#### Details
- `Enemy`는 `bossMilestoneId`가 있으며 `definition.id`가 `lava-giant` 또는 `lava-magician`일 때만 container `setScale(2)`를 적용한다. 이 스케일은 body, 그림자, 머리표시를 함께 키운다.
- `Enemy.hitRadius`는 두 용암 보스에 `BOSS_COLLISION_RADIUS`를 반환하게 하고 다른 보스/적의 기존 48/26/18 판정은 유지한다.
- `BOSS_COLLISION_RADIUS`는 46에서 92로, `LAVA_GIANT_CHARGE_SPEED`는 360에서 1080으로 변경한다. 기존 charge swept-collision, spawn bounds, magician teleport inset은 이 상수를 사용하도록 유지한다.
- `EnemyDirector.enemyRadius`는 일반 보스의 기존 46을 유지하고, 용암 거인/매지션에만 92를 쓴다.
- 테스트는 speed 1080과 collision radius 92를 확인하며 거인의 기존 2초 예고·고정 조준·스턴 동작이 변하지 않았음을 기존 테스트로 확인한다.

### I02. 고정형 매지션, 한 타격 마법진, 두 배 소환 속도

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `startBoss`, `update`, `advanceActiveBossGimmick`, `addLavaSigil` — edge spawn, stationary filtering, teleport, boss-specific sigil rules; modify
  - `apps/web/src/game/systems/BossGimmickSystem.ts` :: `LAVA_MAGICIAN_INITIAL_SUMMON_MS`, `LAVA_MAGICIAN_MIN_SUMMON_MS`, `LAVA_MAGICIAN_SUMMON_REDUCTION_MS`, `getLavaMagicianSummonInterval`, `chooseLavaMagicianTeleport` — half-time cadence and edge inset; modify
  - `apps/web/src/game/systems/LavaSigilSystem.ts` :: `LAVA_SIGIL_MAX_HP`, `applyLavaSigilHit` — one-hit health; modify
  - `apps/web/src/game/entities/LavaSigil.ts` :: `LavaSigil.constructor`, `drawHpIndicators` — one HP indicator; modify if the current loop assumes three
  - `apps/web/src/game/test/BossGimmickSystem.test.ts` :: mage interval/edge case tests; modify
  - `apps/web/src/game/test/LavaSigil.test.ts` :: one-hit destruction and old HP clamping; modify

#### Details
- `startBoss` creates a new lava magician position via `chooseLavaMagicianTeleport(this.random, WORLD_WIDTH, WORLD_HEIGHT, caravanPosition)` so first appearance chooses one of the four edges with current wagon exclusion. Existing 10%-threshold teleport reuses this helper.
- `EnemyDirector.update` does not receive the active lava magician, so it cannot pursue or directly melee the player/caravan; the magician continues summoning sigils and receiving weapon hits. When its HP threshold is crossed, `updateLavaMagician` moves it to a new edge as before.
- Edge inset uses `BOSS_COLLISION_RADIUS + 2` (94px after resize), keeping the 184px sprite within visible world bounds. Existing wagon exclusion rectangle expands to the new radius.
- Set summon constants to `INITIAL=2000`, `MIN=1500`, `REDUCTION=50`. At zero through ten crossed thresholds, intervals are respectively 2000 down to 1500 in 50ms steps. Existing initial summon cooldown and post-summon interval both use `getLavaMagicianSummonInterval` when scheduling subsequent summons; initialize first cooldown using the new 2000ms base.
- Set `LAVA_SIGIL_MAX_HP=1`. `LavaSigil` constructor already clamps restored HP to `maxHp`, thus previously saved sigils also restore at 1 HP. Render indicator(s) based on the new max HP, not a hard-coded 3.
- Tests verify interval at threshold 0, 1, 5, 10; magician destination lies at an edge and outside the enlarged wagon rectangle; a first valid sigil hit kills it; restoring hp 3 clamps to 1. Unknown or repeated hit after dead continues to be rejected by existing `resolveHit` semantics.

## Acceptance Criteria
- [x] Lava giant and magician appear at twice their prior width and height; other units are unaffected.
- [x] Their hit radii and edge safety margin match the enlarged appearance.
- [x] Giant charge speed is 1080 world pixels/second.
- [x] Magician remains stationary between threshold teleports and teleports to one of four safe edges after each 10% HP threshold.
- [x] Magic sigils are destroyed by one valid attack and spawn every 2 seconds initially; cadence reaches 1.5 seconds minimum as HP falls.
- [x] Focused tests, web typecheck and production build pass.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts src/game/test/LavaSigil.test.ts` — boss and sigil tests pass.
- `npm run typecheck --workspace @caravan/web` — web TS checks pass.
- `npm run build --workspace @caravan/web` — production build passes.

## Commit Message
```text
feat(game): tune lava midboss scale and mechanics

Plan: 2026-11-16-caravan-lava-boss-tuning
Phase: P01-lava-boss-tuning
Task: T01-tune-lava-bosses

- Double lava boss scale and increase giant charge speed
- Keep the magician at screen edges and make sigils faster to clear
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
