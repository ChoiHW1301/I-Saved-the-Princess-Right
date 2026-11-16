# Plan: 거인 돌진속도와 마법진 타격 확인

## Goal
용암 거인 돌진속도를 20% 낮추고, 실제 게임 무기 공격 한 번에 HP 1 마법진이 파괴되는지 재현 테스트로 확인한다.

## Phase
- [P01 돌진 및 타격 회귀 검증](./phases/2026-11-16-caravan-giant-speed-sigil-hit/P01-charge-and-sigil-hit/phase.md)

## Scope
- 보스 속도 상수와 검증값 변경.
- WeaponSystem을 통한 마법진 유효 타격 및 파괴 콜백 테스트 추가.
- 구현된 동작이 통과하면 무기 지향/사거리 기반 판정이 명중 조건임을 확인 결과로 기록한다. 테스트에서 누락이나 불일치가 드러나면 해당 경로를 수정한다.

## Out of Scope
- 마법진 HP, 폭발범위, 퓨즈 시간 조정.
- 공격 방향이나 무기 사거리 규칙 변경.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts src/game/test/LavaSigil.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료

