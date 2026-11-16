# Task: T01 숨겨진 보스 테스트 실행

## Status: done

## Goal
개발 빌드의 메인 로고에서 보스 선택 패널을 열고, 선택된 보스를 캠페인 일정의 출현 시점에 강제 소환하는 로컬 테스트 런을 구현한다. 테스트 런은 계정 저장·랭킹·보상에 영향을 주지 않는다.

## Decision Summary
- 로고 클릭으로 오른쪽 선택 패널을 열고, 보스 선택 즉시 전사로 전용 테스트 런을 시작한다.
- 보스/시점: `lava-giant`·`lava-magician` 300초, `castle-warlord` 600초, `forest-warden` 900초, `princess-demon`·`king-guard` 1200초. 최종 보스 선택은 카르마 경로를 무시한다.
- 기능은 `import.meta.env.DEV` 전용이며 테스트 런은 결과 제출 및 snapshot 저장을 건너뛴다.

## Implementation

### I01. 테스트 보스 시나리오 정의 및 일정 검증

- Related Files:
  - `apps/web/src/game/content/BossTestScenario.ts` :: `BossTestScenario`, `bossTestScenarios`, `getBossTestScenario` — 보스 ID를 일정 슬롯·초·정확한 강제 보스 ID로 매핑; new
  - `apps/web/src/game/test/BossTestScenario.test.ts` :: `boss test scenario mapping` — 모든 지원 보스의 시간대와 ID를 확인; new
  - `apps/web/src/game/content/bosses.ts` :: `bossCatalog`, `bossDisplayName` — 현재 제공하는 표시명/ID 참조; read-only
  - `apps/web/src/game/content/campaignSchedule.ts` :: `campaignSchedule` — 실제 시간 및 슬롯 ID 참조; read-only

#### Details
- `BossTestScenario` 타입은 `{ bossId: BossId; atSeconds: number; milestoneId: string; kind: 'miniboss' | 'final-boss' }` 필드를 가진다.
- 순서는 300초 lava slot (`lava-5min-slot`), 600초 (`castle-warlord-10min`), 900초 (`forest-warden`), 1200초 final (`princess-demon` milestone)로 고정한다. lava 슬롯에서는 선택한 lava ID를 milestone의 `bossId`로 설정한다.
- 카탈로그의 레거시 `lava-behemoth`는 선택 목록에 넣지 않는다. 각 항목은 화면에 보일 이름을 `bossDisplayName[bossId]`에서 가져온다.
- 알 수 없는 `BossId`는 `undefined`를 반환하고 실행하지 않는다.
- 테스트는 six supported IDs and exact mapping; legacy lava-behemoth exclusion; unknown-id rejection을 확인한다.

### I02. 메인 화면 숨겨진 진입 및 테스트 런 시작

- Related Files:
  - `apps/web/src/features/home/HomePage.tsx` :: `HomePage`, `startDeveloperBossTest` — dev-only logo handler와 panel, 독립 테스트 run state 추가; modify
  - `apps/web/src/features/home/HomePage.css` :: `.game-logo-secret`, `.dev-boss-panel`, `.dev-boss-option` — 투명 로고 hit target 및 화면 오른쪽 drawer 스타일; modify
  - `apps/web/src/game/GameCanvas.tsx` :: `GameCanvas` — `debugBossId`를 월드에 넘기고 dev test state에서 저장·제출을 차단; modify

#### Details
- `HomePage`의 `runLaunch`는 `{ runId: string; save?: CurrentRunSaveV1; debugBossId?: BossId } | null`로 확장한다. 추가 state `developerBossPanel`은 boolean이다.
- `import.meta.env.DEV`에서만 배너 로고 이미지 위에 투명한 실제 `<button>` hit target을 두고, `onClick`으로 `developerBossPanel`을 토글한다. button은 이미지 외형/크기를 바꾸지 않고 한국어 `aria-label`을 제공한다. 프로덕션에는 button과 panel이 렌더되지 않는다.
- 열린 panel은 오른쪽 drawer 형태이며 catalog의 scenario list를 표시한다. 항목 버튼 이름은 `bossDisplayName`에서 표시한다. 닫기 버튼은 panel을 닫는다.
- `startDeveloperBossTest(bossId)`는 dev 빌드에서 scenario를 확인한 뒤 `setSelectedCharacter('warrior')`, `setRunLaunch({ runId: 'dev-boss-' + bossId + '-' + Date.now(), debugBossId: bossId })`, `setPlaying(true)`를 실행한다. `RunController.startNew`, 저장된 원정 교체 확인, pending result gate, `replaceProfile`은 호출하지 않는다.
- GameCanvas에는 `debugBossId?: BossId` prop을 추가한다. debug mode는 `import.meta.env.DEV && debugBossId !== undefined`일 때만 true다.
- debug mode의 pause UI는 저장 버튼 대신 `야영지로 돌아가기` 버튼을 제공하고, 일반 사용자와 동일한 계속하기 동작을 제공한다.
- debug mode의 결과 화면은 일반 `ResultPage`/submit flow를 쓰지 않는다. 짧은 테스트 종료 안내와 야영지 복귀 버튼을 보여준다.
- Snapshot ready handler 및 30초 autosave에서 controller를 호출하지 않는다. Network save/error overlay도 발생하지 않는다.

### I03. Phaser 월드 초기화 및 강제 보스 시작

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `RunWorldConfig`, `create`, `startBoss`, `createRunSnapshot` — debug boss 설정, 캠페인 clock 기준 시점 시작, 지정 boss 강제 소환, snapshot 방지; modify
  - `apps/web/src/game/config/createGameConfig.ts` :: `createGameConfig` — 기존 `RunWorldConfig` 전달 확인; 필요한 최소 수정만 허용

#### Details
- `RunWorldConfig`에 `debugBossId?: BossId` 추가한다. `createGameConfig`는 config를 이미 `CaravanScene`에 넘기므로 별도 변경은 불필요하다.
- dev debug scenario인 경우 snapshot restore가 없을 때 `CampaignClock`을 `{ elapsedSeconds: scenario.atSeconds, emittedIds: campaignSchedule.filter(m => m.atSeconds <= scenario.atSeconds).map(m => m.id) }`로 만든다. `run.elapsedSeconds`도 같은 초로 설정한다. 이전 캠페인 슬롯/이벤트를 다시 발생시키지 않는다.
- 기본 씬/HUD/캐릭터 생성이 끝난 직후 selected scenario milestone을 구성하여 `startBoss(milestone, debugBossId)`를 한 번 호출한다. 해당 milestone의 `id`, `kind`, `atSeconds`는 scenario 값이며 `bossId`는 강제 선택 ID다.
- `startBoss(milestone, forcedBossId?)`는 `forcedBossId`가 있으면 final karma/random 선택보다 우선한다. 평상시 인자 없는 경로의 동작은 그대로 유지한다.
- debug test가 production에서 직접 configuration을 받더라도 강제 ID가 동작하지 않도록 scene 시작 전에 `import.meta.env.DEV` 확인한다.
- `createRunSnapshot`은 개발 테스트 run이면 즉시 반환하고 `snapshot-ready`를 emit하지 않는다. 인게임의 30초 autosave, level checkpoint, pause save 요청은 외부 API에 도달할 수 없다.

## Acceptance Criteria
- [x] DEV 메인 화면의 로고를 클릭하면 보스 선택 drawer가 열리고 닫기 버튼으로 닫힌다.
- [x] 보스 버튼 6개가 해당 캠페인 시점(5·10·15·20분)에 직접 시작하며 무작위/카르마 선택이 개입하지 않는다.
- [x] 시작 시 이전 event/boss가 재생되지 않고 캠페인 시간은 선택 보스의 원래 시간으로 표시된다.
- [x] 테스트 run이 `startNew`, `saveSnapshot`, `submitResult`, `retryResult`를 호출하지 않는다.
- [x] 테스트 종료와 일시정지에서 야영지로 돌아갈 수 있다.
- [x] production build에는 숨은 버튼 동작과 panel이 노출되지 않는다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossTestScenario.test.ts` — scenario mapping tests pass.
- `npm run typecheck --workspace @caravan/web` — web TS checks pass.
- `npm run build --workspace @caravan/web` — production build passes and dev-only UI is removed/disabled by Vite define.

## Commit Message
```text
feat(web): add hidden developer boss test mode

Plan: 2026-11-16-caravan-dev-boss-test-mode
Phase: P01-dev-boss-launch
Task: T01-hidden-boss-launch

- Add a dev-only logo entry and boss selection drawer
- Launch bosses at scheduled campaign times without saving test runs
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
