# Task: T01 훨윈드 검 궤적 범위 일치

## Status: done

## Goal
훨윈드의 실제 타격 원과 검 궤적의 바깥쪽 반경이 기본 및 사거리 강화 후에도 같게 한다.

## Implementation
- `apps/web/src/game/systems/WarriorEvolutionCombat.ts` :: `getWarriorSwordRange(baseRange: number, swordRangeBonus: number): number` 추가. 저장 필드나 스키마 변경 없음.
- `apps/web/src/game/systems/WeaponSystem.ts` :: 검 사거리 계산에 공통 함수 사용. 비검 무기는 기존 계산 유지.
- `apps/web/src/game/scenes/CaravanScene.ts` :: `updateWhirlwindVisual`, `drawWhirlwindTrail`에서 검 기본 사거리와 강화 보너스를 같은 함수로 계산하고 반경 상한 제거. 원형 판정에 맞춰 세로 반경도 동일하게 한다. 현재 회전·색·피해 판정은 유지.
- `apps/web/src/game/test/WarriorEvolutionCombat.test.ts` :: 기본 및 강화 검 범위 계산 검증.

## Acceptance Criteria
- [x] 기본 훨윈드 타격과 궤적 반경이 모두 125다.
- [x] `sword-range`를 올리면 실제 타격과 궤적이 동일한 수치만큼 커진다.
- [x] 타격 간격과 피해량 및 캐릭터 회전은 유지한다.

## Validation
- `npm run test --workspace @caravan/web -- WarriorEvolutionCombat.test.ts`
- `npm run typecheck`
- `npm run build --workspace @caravan/web`

## Commit Message
```text
fix(game): match whirlwind trail to hit range

Plan: 2026-11-17-caravan-whirlwind-range-match
Phase: P01-range-match
Task: T01-range-match

- Share sword range calculation between combat and visual effect
- Remove visual range cap and align the circular sweep
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: `0351409`
