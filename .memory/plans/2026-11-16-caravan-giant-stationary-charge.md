# Plan: 용암 거인 제자리 돌진 패턴

## Goal
용암 거인의 추적 이동을 없애고, 플레이어 조준을 유지하되 가장 가까운 벽을 향하는 방향 성분을 금지하며 몸체를 월드 경계 안에 유지한다.

## Phase
- [P01 제자리 패턴 및 벽 방향 제한](./phases/2026-11-16-caravan-giant-stationary-charge/P01-stationary-charge/phase.md)

## Scope
- 기존 최소 돌진거리 보정 제거.
- 거인을 EnemyDirector 추적/이동에서 제외하고 예고·돌진 패턴만 반복.
- 보스 중심을 충돌 반경만큼 경계 안쪽에 제한.
- 가장 가까운 벽 방향 성분을 0으로 잘라 플레이어 조준을 가능한 유지.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료


