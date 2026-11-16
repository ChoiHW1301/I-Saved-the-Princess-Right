# Plan: 마차와 겹치는 마법진 레이어

## Goal
마차 그림과 겹쳐 소환된 라바 매지션 마법진만 마차 뒤에 렌더링한다.

## Phase
- [P01 마법진 레이어 배치](./phases/2026-11-16-caravan-sigil-wagon-layer/P01-sigil-layer/phase.md)

## Scope
- 소환 및 저장 데이터 복원 때 마법진의 보이는 범위와 마차 그림 영역이 겹치는지 판정.
- 겹치면 깊이 5, 그 외에는 현재 깊이 7 유지.
- 기존 폭발 판정과 마차 충돌 판정은 변경하지 않는다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/LavaSigil.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료

