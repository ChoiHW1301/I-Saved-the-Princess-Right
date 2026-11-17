# Task: T02 보스 사망 연출과 진화 선택

## Status: done

## Goal
5분 보스 HP가 0이 되면 사망 연출을 재생하고, 전사에게 무작위 두 트리 중 하나를 선택하게 한다. 선택 뒤 맵 전환과 기존 레벨업·저장 흐름을 재개한다.

## Decision Summary
- 연출 중에는 전사 이동만 허용한다. 몬스터·공격·진행 시간은 멈춘다. 선택 중에는 이동도 멈춘다.
- 선택은 5분 보스 두 종류에만 적용하고 전사 외 캐릭터는 연출 후 보상 없이 진행한다.

## Implementation

### I01. 사망 단계 및 보스 완료 순서
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `onEnemyDefeated`, `update`, `completeBoss`, `chooseUpgrade`, `createRunSnapshot`, `create` — 사망 연출·선택 상태·이어하기 연결; modify
  - `apps/web/src/game/systems/CampaignClock.ts` :: `pause`, `resume` — 보스 사망까지 시간 고정 기존 API; read-only
  - `apps/web/src/game/systems/BossDirector.ts` :: `defeatBoss` — 보스 완료 호출 시점 확인; read-only
  - `apps/web/src/game/content/BossTestScenario.ts` :: 5분 테스트 보스/클리어 후 진입 매핑; read-only

#### Details
- **Signatures & Types**:
  ```typescript
  // CaravanScene additions
  private pendingEvolutionChoices: readonly [WarriorEvolutionId, WarriorEvolutionId] | null;
  private beginFiveMinuteBossDeath(enemy: Enemy): void;
  private finishFiveMinuteBossDeath(milestoneId: string): void;
  private chooseWarriorEvolution(evolutionId: WarriorEvolutionId): void;
  ```
- **Data & Schema Fields**: 씬의 일시적 `pendingEvolutionChoices`는 `null` 또는 중복 없는 2개 ID. 선택 확정 전에는 `run.warriorEvolutionId === null`; 확정 후 선택 ID 하나. 일반 저장에는 미완료 사망 연출·보상 선택 중간 상태를 기록하지 않는다.
- **Execution Flow / Logic**:
  1. Precondition: `enemy.bossMilestoneId === 'lava-5min-slot'`, `activeBossMilestoneId` 일치, 보스 HP 0, 중복 호출 방지. 10분·15분·최종 보스는 기존 완료 경로를 유지한다.
  2. Core: 보스의 기존 `boss:` 캠페인 pause를 유지한다. 사망 연출 플래그 중 `update`는 전사의 방향키 이동·걷기 모션·월드 경계 및 마차 충돌만 처리하고 적 AI, 공격, 보상, 이벤트, 스폰·타이머·HUD 시간 증가를 실행하지 않는다. 보스 스프라이트에는 각 종류에 어울리는 짧은 픽셀 사망 연출을 만들고 완료 콜백을 1회만 호출한다. 예: 거인은 조각이 아래로 무너지고, 매지션은 마법 입자와 함께 분해된다. 일률적인 크기 확대·페이드만으로 끝내지 않는다.
  3. Completion: 연출 종료 후 전사면 T01 `rollWarriorEvolutionChoices(this.random)` 호출, 씬 입력 정지, `gameEventBus.emit('warrior-evolution-offer', { choices })`, `scene.pause()`로 선택을 대기한다. 전사 외 캐릭터는 `completeBoss`를 즉시 호출한다. 선택 응답 ID가 후보에 없거나 이미 선택했다면 무시한다.
  4. State: 유효한 선택 뒤 `run.warriorEvolutionId`를 기록하고 `bossDirector.defeatBoss`·마일스톤 완료·`campaignClock.resume`을 정확히 1회 실행한다. 대기 중인 일반 레벨업 선택이 있으면 그 창을 이어서 표시한다. 모든 선택이 끝난 후 체크포인트 저장 요청을 한 번만 보낸다. 선택 완료 전에 체크포인트 저장을 요청하지 않는다. 씬 재시작/종료 시 타이머·트윈·버스 리스너 해제.
- **Error & Exception Handling**: 두 번째 사망/선택 이벤트는 무시; 공격과 대시 입력도 연출 중 비활성화; 보스 사망과 플레이어 사망이 같은 틱이면 이미 끝난 원정에는 보상 창을 열지 않음. 로컬 개발자 보스 테스트는 기존처럼 저장·결과 제출 없음. 기존 5분 보스 클리어 후 테스트는 이미 완료된 마일스톤으로 시작하므로 선택 창을 다시 띄우지 않음.

### I02. 타입이 있는 이벤트 및 React 선택 화면
- Related Files:
  - `apps/web/src/game/bridge/GameEventBus.ts` :: `GameEvents` — 제안·선택·완료 이벤트; modify
  - `apps/web/src/game/GameCanvas.tsx` :: `GameCanvas` — 제안 상태, 구독, 입력 제출, 오버레이 렌더링; modify
  - `apps/web/src/game/ui/WarriorEvolutionOverlay.tsx` :: `WarriorEvolutionOverlay` — 두 카드/설명/키보드 접근성; new
  - `apps/web/src/game/ui/WarriorEvolutionOverlay.css` :: 오버레이 스타일 — 기존 픽셀 판타지 UI와 4:3 화면에 맞는 크기; new
  - `apps/web/src/game/test/WarriorEvolutionOverlay.test.tsx` :: 두 카드와 선택 전달 검증; new

#### Details
- **Signatures & Types**:
  ```typescript
  // GameEvents
  'warrior-evolution-offer': { choices: readonly [WarriorEvolutionId, WarriorEvolutionId] };
  'warrior-evolution-choice': { evolutionId: WarriorEvolutionId };
  'warrior-evolution-complete': null;
  // React component
  export function WarriorEvolutionOverlay(props: {
    choices: readonly [WarriorEvolutionId, WarriorEvolutionId];
    onChoose(evolutionId: WarriorEvolutionId): void;
  }): JSX.Element;
  ```
- **Data & Schema Fields**: React의 선택 상태는 `null | readonly [WarriorEvolutionId, WarriorEvolutionId]`; 게임 원본은 `run.warriorEvolutionId`. 오버레이는 `role="dialog"`, 두 버튼, 카드명·전투 방식·전용 강화 설명 표시. 카드는 네 트리의 이미지/아이콘을 기존 게임 UI 표현에 맞춰 구분하되 원본 선택 ID는 텍스트 표시하지 않는다.
- **Execution Flow / Logic**:
  1. `GameCanvas`가 제안 이벤트를 받으면 오버레이를 보이고 클릭·Enter/Space로 선택 이벤트를 보낸다.
  2. 씬은 현재 제안 집합과 ID를 대조해 한 번만 기록한다.
  3. 완료 이벤트가 오면 React 오버레이를 닫는다. 언마운트 시 이벤트 구독 해제.
  4. 네트워크 저장 실패/재개가 발생해도 진화 선택 완료 상태를 초기화하지 않는다.

### I03. 위험 시나리오 검증
- Related Files:
  - `apps/web/src/game/test/CampaignClock.test.ts` :: 보스 타이머 정지/재개 검증; modify
  - `apps/web/src/game/test/WarriorEvolution.test.ts` :: 선택 유효성/5분 전용/중복 방지 검증; modify

#### Details
- 사망 연출 동안 경과 시간이 증가하지 않는지, 선택 완료 뒤 한 번만 증가하는지 검증한다.
- 전사 5분 보스 후보 2개·다른 캐릭터 보상 없음·10분 이상 보스 영향 없음·두 번 클릭 시 중복 보상 없음·대기 일반 레벨업과 체크포인트 순서 검증.

## Acceptance Criteria
- [ ] 5분 보스의 종류별 사망 연출 종료 후 전사에게 두 개의 서로 다른 진화 트리가 나타난다.
- [ ] 연출 중 전사 이동만 가능하고 몬스터·공격·시간은 멈춘다.
- [ ] 선택 후 일반 레벨업과 체크포인트 저장이 올바른 순서로 진행된다.
- [ ] 다른 캐릭터·다른 보스·기존 클리어 후 테스트에는 진화 창이 나오지 않는다.

## Validation
- `npm run test --workspace @caravan/web -- WarriorEvolution.test.ts WarriorEvolutionOverlay.test.tsx CampaignClock.test.ts` — 선택·화면·시간 흐름 검증
- `npm run typecheck` — React/Phaser 이벤트 타입 검사
- `npm run build --workspace @caravan/web` — 화면·씬 빌드 통과

## Commit Message
```text
feat(game): offer warrior evolution after lava boss death

Plan: 2026-11-17-caravan-warrior-five-minute-evolution
Phase: P01-warrior-evolution
Task: T02-boss-death-choice

- Add distinct lava boss death sequences and a two-choice overlay
- Resume milestones, queued level-ups, and checkpoint only after choice
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: 이번 Task 커밋
