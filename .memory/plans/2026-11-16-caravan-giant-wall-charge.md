# Plan: 용암 거인 벽 근처 돌진 보정

## Goal
용암 거인 돌진속도를 1000으로 조정하고, 충돌 전 받는 피해를 반으로 줄이며, 플레이어 조준을 최대한 유지한 채 벽에 즉시 충돌하지 않도록 돌진 방향을 보정한다.

## Phase
- [P01 돌진 방향 및 피해 조정](./phases/2026-11-16-caravan-giant-wall-charge/P01-charge-correction/phase.md)

## Scope
- 순수한 방향 보정 계산을 `BossGimmickSystem`에 추가해 테스트한다.
- 돌진 예고 화살표 및 실제 돌진이 같은 보정 방향을 사용하도록 한다.
- 돌진 전 피해 배율 0.5, 스턴 중 1.5를 적용한다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료

