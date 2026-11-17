# Task: T01 5분 클리어 후 진화 선택

## Status: done

## Goal
개발자 모드의 용암 거인·라바 매지션 ‘보스 클리어 후’ 테스트에서 실제 5분 보상과 같은 무작위 두 진화 트리 중 하나를 고른 뒤 전투를 시작한다.

## Decision Summary
- `.memory/decisions/2026-11-17-caravan-post-clear-evolution-test.md` D01~D04 적용.
- 10분·15분 테스트에는 선택창을 띄우지 않고, 이미 클리어된 보스의 완료 이벤트를 중복 발행하지 않는다.

## Implementation

### I01. 개발자 테스트 대상 판별
- Related Files:
  - `apps/web/src/game/content/BossTestScenario.ts` :: `getBossPostClearTestScenario` 및 5분 슬롯 판별 헬퍼; modify
  - `apps/web/src/game/test/BossTestScenario.test.ts` :: 클리어 후 대상별 판별 테스트; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export function shouldOfferPostClearEvolution(bossId: BossId, characterId: string): boolean;
  ```
- **Data & Schema Fields**: 새로운 저장 필드 없음. 기존 `BossPostClearTestScenario.milestoneId: string`이 `lava-5min-slot`인지 확인한다.
- **Execution Flow / Logic**:
  1. `getBossPostClearTestScenario(bossId)`로 목록에 있는 보스인지 확인한다.
  2. 전사이며 시나리오의 `milestoneId`가 `lava-5min-slot`일 때만 `true`를 반환한다.
  3. 알 수 없는 ID, 10분·15분 보스, 다른 캐릭터는 `false`를 반환한다.

### I02. 진화 선택 장면 연결
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `finishFiveMinuteBossDeath`, `chooseWarriorEvolution`; modify
  - `apps/web/src/game/GameCanvas.tsx` :: `WarriorEvolutionOverlay` 이벤트 구독 경로 확인; read-only
  - `apps/web/src/features/home/HomePage.tsx` :: `startDeveloperPostClearTest`의 보스 ID 전달 확인; read-only

#### Details
- **Signatures & Types**: `private postClearEvolutionTest = false` 장면 전용 플래그. 기존 `RunState.warriorEvolutionId`와 `readonly [WarriorEvolutionId, WarriorEvolutionId]`를 그대로 사용한다.
- **Data & Schema Fields**: 저장 스키마 변경 없음. 디버그 진입은 기존 `debugPostClearBossId?: BossId`를 사용한다.
- **Execution Flow / Logic**:
  1. `create`에서 스냅샷 없이 개발자 모드의 클리어 후 시나리오를 복원한 뒤, 5분 대상이면 기존 무작위 두 트리 선택 흐름을 호출한다.
  2. 기존 `fiveMinuteBossDeathPhase='choice'`, `pendingEvolutionChoices`, `scene.pause`, `warrior-evolution-offer` 이벤트를 이용해 전투와 시간을 선택 중 멈춘다.
  3. 선택 시 기존 진화 효과(선봉장의 체력·오라 포함)를 적용하고 `warrior-evolution-complete`를 발행해 선택창을 닫고 장면을 재개한다.
  4. 디버그 클리어 후 경로에서만 `boss-defeated` 재발행을 생략한다. 실제 5분 보스 처치 경로는 기존 이벤트를 유지한다.
  5. `postClearEvolutionTest`는 `create`마다 재설정한다. 개발자 테스트 기존 비저장 처리를 유지한다.

## Acceptance Criteria
- [ ] 5분 용암 거인·라바 매지션 클리어 후 테스트 모두 무작위 두 선택지를 표시한다.
- [ ] 선택한 한 트리의 전투 효과가 적용되고 선택창을 닫은 뒤 전투·시간이 재개된다.
- [ ] 10분·15분 클리어 후 테스트에 진화 선택이 나타나지 않는다.
- [ ] 선택 때문에 보스 완료/체크포인트 이벤트가 중복되지 않는다.

## Validation
- `npm run test --workspace @caravan/web -- BossTestScenario.test.ts WarriorEvolution.test.ts` — 5분 대상 및 기존 무작위 쌍 규칙 확인
- `npm run typecheck` — 게임 장면·계약 타입 검사
- `npm run build --workspace @caravan/web` — 웹 프로덕션 빌드

## Commit Message
```text
feat(game): choose warrior evolution in post-clear test

Plan: 2026-11-17-caravan-post-clear-evolution-test
Phase: P01-post-clear-evolution
Task: T01-post-clear-evolution-choice

- Offer two random evolution trees after five-minute boss clear test starts
- Resume the test with the chosen tree without repeating boss completion
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
