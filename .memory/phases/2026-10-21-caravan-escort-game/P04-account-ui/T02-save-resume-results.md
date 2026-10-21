# Task: T02 임시 저장·이어하기·결과 제출 통합

## Status: pending

## Goal
활성 게임의 자동·수동 저장, 연결 장애 중 일시 정지, 계정 저장 복구, 판 종료 보상 제출을 웹과 게임 상태에 연결한다.

## Decision Summary
- 자동 저장은 30초 간격과 이벤트 선택·준보스 처치 시 실행한다. 일시 정지 메뉴에서 수동 저장을 지원한다.
- 연결 장애 시 IndexedDB에 임시 snapshot을 보관하고 게임을 멈춘다. 연결 복구와 서버 동기화 후 저장 지점에서 이어간다.

## Implementation

### I01. API-backed save lifecycle and local recovery
- Related Files:
  - `apps/web/src/features/run/runApi.ts` :: `loadSave`, `putSave`, `deleteSave`, `submitRun`; new
  - `apps/web/src/features/run/localSaveStore.ts` :: `LocalSaveStore` — IndexedDB; new
  - `apps/web/src/features/run/RunController.ts` :: `startNew`, `continueRun`, `pauseForNetwork`, `resumeAfterSync`; new
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `createSnapshot`, `restoreSnapshot`; new
  - `apps/web/src/features/run/SaveResume.test.ts` :: save flow cases; new
- **Signatures & Types**:
  ```typescript
  export interface LocalSaveStore { get():Promise<CurrentRunSaveV1|null>; put(value:CurrentRunSaveV1):Promise<void>; clear():Promise<void>; }
  export class RunController { startNew(characterId:CharacterId):Promise<void>; continueRun():Promise<void>;
    pauseForNetwork():Promise<void>; resumeAfterSync():Promise<void>; submitResult(result:RunSubmission):Promise<RunReceipt>; }
  ```
- **Data & Schema Fields**: save snapshot uses contracts `CurrentRunSaveV1`, `schemaVersion=1`, revision/ETag. Local IndexedDB database `caravan-game-local`, object store `pending-save`, key `current`; local payload stores no bearer token. Sync status `clean|pending|conflict`.
- **Execution Flow / Logic**: 30-second timer and milestone events request a snapshot; successful PUT updates revision and clears matching local pending item. Network/API unavailable writes local snapshot and sets `pausedBy='network'`; reconnect performs GET server state, resolves only if `runId` and revision agree, uploads local pending snapshot using expected revision, then restores the exact scene and resumes. On home, Continue loads server save first; New asks confirmation before deleting old save and starting. Manual pause-save writes snapshot and returns to home.
- **Error & Exception Handling**: API 409 shows save conflict dialog with server version as source; never silently overwrite a newer revision. If local save fails, keep run paused and show retry/export-free recovery message. Token expiry reauthenticates before resuming; no save payload includes auth token.

### I02. Result, rewards, and run termination
- Related Files:
  - `apps/web/src/features/run/RunController.ts` :: `finishRun`, `submitResult`; modify
  - `apps/web/src/features/results/ResultPage.tsx` :: `ResultPage` — score, gold, ending; new
  - `apps/web/src/features/results/ResultPage.test.tsx` :: outcome states; new
- **Data & Schema Fields**: `RunSubmission` includes run ID, character ID, status, elapsed seconds, kills, boss IDs, final karma, and ending ID. `RunReceipt` contains server score, gold award, unlocks, updated profile, and board updates.
- **Execution Flow / Logic**: wagon loss or final boss victory closes game simulation; result is submitted once; success replaces profile and removes server/local current save; failure retains pending result locally and displays retry. Archer unlocks after any completed run; mage unlocks after `won`; merchant threshold uses server lifetime gold.
- **Error & Exception Handling**: submission retry reuses same runId; API idempotency prevents double rewards; 401 reauth, 403 show access failure, 503 retain pending receipt.

## Acceptance Criteria
- [ ] User can save manually and continue after returning home or reopening browser
- [ ] Autosave executes at 30 seconds and required event/boss milestones
- [ ] Network failure pauses run and local snapshot resumes after successful sync
- [ ] New game requires confirmation when a saved run would be replaced
- [ ] Result submission persists rewards/unlocks exactly once and deletes current save after success

## Validation
- `npm run test --workspace apps/web -- src/features/run/SaveResume.test.ts src/features/results/ResultPage.test.tsx` — autosave, offline, retry, result flows pass
- `npm run test --workspace apps/api -- test/services/runService.test.ts` — duplicate submission does not duplicate reward
- `npm run typecheck` — run lifecycle types pass

## Commit Message
```text
feat(save): add resumable runs and result submission

Plan: 2026-10-21-caravan-escort-game
Phase: P04-account-ui
Task: T02-save-resume-results

- Add 30-second and milestone saves with IndexedDB recovery
- Resume synchronized runs and submit idempotent results
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
