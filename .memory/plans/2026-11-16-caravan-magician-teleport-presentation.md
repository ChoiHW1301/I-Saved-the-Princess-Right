# Plan: 라바 매지션 순간이동과 보스 이름 표시

## Goal
라바 매지션의 순간이동에 분리된 소멸·등장 연출을 추가하고, 보스 이름 배너를 화면 아래로 옮긴다.

## Phase
- [P01 순간이동과 배너 표시](./phases/2026-11-16-caravan-magician-teleport-presentation/P01-teleport-and-banner/phase.md)

## Scope
- 순간이동 목적지 계산과 HP 구간 로직은 유지.
- 보스 컨테이너를 페이드/축소 후 이동시키고, 새 위치에서 용암빛 파편과 함께 다시 보이게 한다.
- 연출 중 다음 순간이동이 발생해도 효과가 겹치지 않도록 목적지를 대기시킨다.
- React 보스 이름 배너를 하단 중앙으로 이동한다.

## Validation
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료

