# Plan: 라바 매지션 텔레포트 중복 방지와 저체력 압박

## Goal
매지션이 현재/예약된 텔레포트 위치로 되돌아가지 않게 하고, 체력 50% 이하에서는 소환마다 플레이어 위치에 추가 마법진을 생성한다.

## Phase
- [P01 목적지 중복 방지와 플레이어 표적 소환](./phases/2026-11-16-caravan-magician-pressure-teleport/P01-magician-pressure/phase.md)

## Scope
- 텔레포트 후보 선택 시 현재 위치 및 진행/대기 중인 위치를 제외한다.
- 체력 50% 이하의 각 소환 주기마다 랜덤 마법진과 플레이어 위치 마법진을 각각 하나 생성한다.
- 기존 텔레포트 체력 구간, 소환 주기, 마법진 피해 설정은 유지한다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Status
- [x] P01 완료

