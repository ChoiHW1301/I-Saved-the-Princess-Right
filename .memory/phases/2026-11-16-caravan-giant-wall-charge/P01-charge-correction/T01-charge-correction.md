# Task: T01 돌진 방향·피해 배율 구현

## Status: done

## Goal
돌진속도를 1000으로 설정하고, 돌진 전 피해를 50%로 낮추며, 가장자리에서 충분한 돌진거리가 있도록 목표 방향을 보정한다.

## Related Files
- `apps/web/src/game/systems/BossGimmickSystem.ts` :: 속도/배율 상수, `correctLavaGiantChargeDirection` — modify
- `apps/web/src/game/scenes/CaravanScene.ts` :: `advanceActiveBossGimmick` — 보정된 예고 및 돌진 방향과 단계별 피해 배율 적용
- `apps/web/src/game/test/BossGimmickSystem.test.ts` :: 속도·배율·벽 근처 보정 테스트
- `.memory/decisions/2026-11-16-caravan-giant-wall-charge.md` :: 확정 요구사항

## Details
- `LAVA_GIANT_CHARGE_SPEED = 1000`.
- 돌진 전/예고/돌진 중 damageTakenMultiplier는 0.5, 벽 충돌 스턴 중에는 1.5.
- 최소 경계까지 돌진거리는 충돌 반경 92의 3배인 276px.
- 기본 조준이 최소거리를 충족하면 방향은 바꾸지 않는다. 그렇지 않으면 0.5도 단위로 가장 적게 회전해 최소거리를 만족하는 방향을 선택한다.
- 예고 중 표시된 방향과 돌진 시작 시 방향은 같은 함수를 사용한다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Result
- 돌진속도 1000, 예고·돌진 중 받는 피해 50%, 벽 충돌 스턴 중 받는 피해 150% 적용.
- 가장자리 조준을 가능한 최소 각도로 보정하고, 경고선과 돌진 방향을 일치시킴. 최소 경계 거리는 276px.
- 보정 방향, 배율 값 및 피해 계산 테스트 7개 통과; 웹 typecheck와 production build 통과.

## Commit Message
```text
fix(game): steer lava giant away from nearby walls

Plan: 2026-11-16-caravan-giant-wall-charge
Phase: P01-charge-correction
Task: T01-charge-correction

- Restore charge speed to 1000 and halve pre-stun damage taken
- Preserve player aim while securing minimum wall run-up
```

