# Current Context

## Active Plan
[용암 거인 제자리 돌진 패턴](./plans/2026-11-16-caravan-giant-stationary-charge.md)

## Active Phase
[P01 제자리 패턴 및 벽 방향 제한](./phases/2026-11-16-caravan-giant-stationary-charge/P01-stationary-charge/phase.md)

## Active Task
없음 (완료)

## Status
- 용암 거인은 추적 이동 없이 제자리에서 예고·돌진·스턴을 반복한다.
- 이전 최소 돌진거리 보정 제거.
- 가장 가까운 벽을 향하는 돌진 벡터를 금지하고, 보스 중심을 경계 안에 유지한다.
- 돌진속도 1000; 충돌 전 받는 피해 50%, 스턴 중 150% 유지.
- 집중 테스트 7개, 웹 typecheck, production build 통과.

## Next Step
필요하면 로컬 보스 테스트 모드에서 경계 근처 돌진을 수동 검증한다.
