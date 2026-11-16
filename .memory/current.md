# Current Context

## Active Plan
[거인 돌진속도와 마법진 타격 확인](./plans/2026-11-16-caravan-giant-speed-sigil-hit.md)

## Active Phase
[P01 돌진 및 타격 회귀 검증](./phases/2026-11-16-caravan-giant-speed-sigil-hit/P01-charge-and-sigil-hit/phase.md)

## Active Task
없음 (완료)

## Status
- 용암 거인 돌진속도를 864 월드픽셀/초로 낮춤(기존 대비 20%).
- WeaponSystem 실제 공격 경로에서 HP 1 마법진 단일 타격 및 제거 콜백 검증 완료.
- 코드상 파괴 결함은 재현되지 않음. 공격은 방향·사거리를 따르므로 유효 타격선이 마법진의 100px 판정 원을 지나야 함.
- 집중 테스트 14개, 웹 typecheck, production build 통과.

## Next Step
필요하면 로컬 보스 테스트 모드에서 조준선이 마법진을 통과하도록 공격해 수동 확인한다.
