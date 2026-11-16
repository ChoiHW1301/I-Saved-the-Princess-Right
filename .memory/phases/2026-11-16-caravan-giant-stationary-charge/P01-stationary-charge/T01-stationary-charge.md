# Task: T01 추적 제외 및 벽 방향 제한 구현

## Status: done

## Goal
거인을 제자리에 두고 예고·돌진만 반복하게 하며, 몸체가 경계를 넘거나 가장 가까운 벽을 향해 돌진하지 않도록 한다.

## Related Files
- `apps/web/src/game/systems/BossGimmickSystem.ts` :: 속도/피해 상수, `avoidNearestWallChargeDirection`, `clampBossPositionToWorld` — modify
- `apps/web/src/game/scenes/CaravanScene.ts` :: `directorEnemies`, `advanceActiveBossGimmick`, `activateCharacterAbility` — modify
- `apps/web/src/game/test/BossGimmickSystem.test.ts` :: 벽방향 제한, 경계 clamp, 최소거리 제거 테스트 — modify
- `.memory/decisions/2026-11-16-caravan-giant-stationary-charge.md` :: 확정 요구사항

## Details
- `LAVA_GIANT_MIN_WALL_CHARGE_DISTANCE`와 거리 확보를 위한 회전 검색을 제거한다.
- 가장 가까운 경계가 좌/우면 x방향 벽쪽 성분, 위/아래면 y방향 벽쪽 성분을 0으로 자른다. 남은 성분을 정규화하고, 0벡터면 벽에서 멀어지는 방향을 선택한다.
- 라바 거인은 모든 기믹 단계에서 EnemyDirector에 전달하지 않는다. 제자리 대기/예고/돌진/스턴 사이클을 유지한다.
- 보스 위치를 `hitRadius`만큼 경계 안쪽에 clamp한다. 돌진과 넉백에도 적용한다.
- 속도 1000, 충돌 전 받는 피해 50%, 스턴 중 150%를 유지한다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Result
- 추적 이동 및 이전 최소거리 보정을 제거했다. 거인은 제자리에서 기존 예고/돌진/스턴 사이클을 반복한다.
- 가장 가까운 벽을 향하는 성분을 제거하고, 벽에서 멀어지거나 평행한 경로만 허용한다. 예고선과 돌진 방향이 동일한 보정 함수를 쓴다.
- 보스 중심은 충돌 반경 안쪽에 clamp된다. 풍령 넉백에도 보스 경계 clamp가 적용된다.
- 속도 1000 및 피해 배율(벽 전 50%, 스턴 중 150%) 유지.
- 집중 테스트 7개, 웹 typecheck, production build 통과.

## Result
- 추적 이동 및 이전 최소거리 보정을 제거했다. 거인은 제자리에서 기존 예고/돌진/스턴 사이클을 반복한다.
- 가장 가까운 벽을 향하는 성분을 제거하고, 벽에서 멀어지거나 평행한 경로만 허용한다. 예고선과 돌진 방향이 동일한 보정 함수를 쓴다.
- 보스 중심은 충돌 반경 안쪽에 clamp된다. 풍령 넉백에도 보스 경계 clamp가 적용된다.
- 속도 1000 및 피해 배율(벽 전 50%, 스턴 중 150%) 유지.
- 집중 테스트 7개, 웹 typecheck, production build 통과.

## Commit Message
```text
fix(game): keep lava giant stationary between charges

Plan: 2026-11-16-caravan-giant-stationary-charge
Phase: P01-stationary-charge
Task: T01-stationary-charge

- Remove giant chase movement and minimum charge distance
- Prevent wallward charge vectors and keep boss inside arena bounds
```


