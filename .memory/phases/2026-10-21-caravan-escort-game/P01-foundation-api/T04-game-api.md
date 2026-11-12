# Task: T04 프로필·저장·결과·랭킹 API

## Status: pending

## Goal
웹 클라이언트가 계정 진행을 읽고, 판을 저장·제출하며, 상위 랭킹과 본인 순위를 조회할 HTTP API를 제공한다.

## Decision Summary
- 모든 `/api` 엔드포인트는 T02의 Entra caller 검증을 통과해야 한다.
- 결과 DTO에서 점수와 gold award는 API 설정으로 산출하며, 동일 `runId` 재전송은 중복 보상을 만들지 않는다.

## Implementation

### I01. 프로필·영구 강화·임시 저장 핸들러
- Related Files:
  - `apps/api/src/functions/profile.ts` :: `getProfile`, `purchaseUpgrad`e` — 프로필 조회/구매; new
  - `apps/api/src/functions/save.ts` :: `getSave`, `putSave`, `deleteSave` — 저장 수명; new
  - `apps/api/src/services/profileService.ts` :: `ProfileService` — 기본 프로필/강화 비용; new
  - `apps/api/src/services/saveService.ts` :: `SaveService` — schema, revision, size rules; new
  - `apps/api/src/functions/index.ts` :: route registration — 함수 등록; modify
  - `apps/api/test/functions/profile-save.test.ts` :: handler tests; new
- **Signatures & Types**:
  ```typescript
  GET /api/profile -> 200 PlayerProfile
  POST /api/profile/upgrades -> 200 PlayerProfile | 400 INVALID_UPGRADE | 409 INSUFFICIENT_GOLD
  GET /api/save -> 200 CurrentRunSaveV1 | 404 SAVE_NOT_FOUND
  PUT /api/save -> 200 CurrentRunSaveV1 | 409 SAVE_CONFLICT | 413 SAVE_TOO_LARGE
  DELETE /api/save -> 204 | 404 SAVE_NOT_FOUND
  ```
- **Data & Schema Fields**: upgrade request `{upgradeId: MetaUpgradeId, expectedProfileVersion:number}`. Save request `{schemaVersion:1, runId:string, expectedRevision:number|null, snapshot:RunSnapshotV1}`. Profile `goldBalance` is integer >= 0; permanent upgrade levels cannot exceed catalog `maxLevel`.
- **Execution Flow / Logic**: authorize caller; derive `userId` from verified `tenantId:objectId`; get-or-create default profile using verified `name`; validate body; use compare-and-swap version/revision; deduct upgrade cost only if balance and level cap allow; never accept userId/displayName from request as identity.
- **Error & Exception Handling**: malformed JSON/schema → 400; unauthenticated → 401; role missing → 403; balance/version conflict → 409; Cosmos outage → 503 `STORAGE_UNAVAILABLE`; error body `{code,message,correlationId}` with no stack/secret.

### I02. 판 제출 및 순위 조회
- Related Files:
  - `packages/contracts/src/runResult.ts` :: `RunSubmission`, `RunReceipt`, `RunSummary` — result contract; new
  - `apps/api/src/services/runService.ts` :: `submitRun`, `calculateScore`, `calculateGoldAward` — idempotent reward and ranking; new
  - `apps/api/src/functions/runs.ts` :: `postRun` — result endpoint; new
  - `apps/api/src/functions/leaderboards.ts` :: `getScoreBoard`, `getClearBoard`, `getMyRank` — query endpoints; new
  - `apps/api/test/services/runService.test.ts` :: scoring/idempotency; new
  - `apps/api/test/functions/leaderboards.test.ts` :: top-ten/personal rank; new
- **Signatures & Types**:
  ```typescript
  export interface RunSubmission { runId:string; characterId:CharacterId; status:'won'|'lost';
    elapsedSeconds:number; kills:number; defeatedBossIds:string[]; karma:number; endingId:EndingId; }
  export interface RunReceipt { runId:string; score:number; goldAward:number; profile:PlayerProfile; }
  POST /api/runs -> 201 RunReceipt | 200 prior RunReceipt
  GET /api/leaderboards/score?limit=10 -> { entries:LeaderboardEntry[]; myRank:number; }
  GET /api/leaderboards/clears?characterId=hero&karmaTier=good&limit=10 -> same shape
  ```
- **Data & Schema Fields**: `ScoreConfig` defaults are `killWeight=100`, `secondWeight=1`, `bossWeight=500`, `clearBonus=2000`; `GoldConfig` defaults are `goldPerKill=1`, `survivalGoldPerMinute=5`, `clearBonus=50`. Store these in `apps/api/src/config/gameRewards.ts` so balancing can change without route edits. Board IDs are `score` and `clear:{characterId}:{karmaTier}`.
- **Execution Flow / Logic**: validate run range (`elapsedSeconds` 0..900, kills 0..10000, karma -100..100, known character, boss IDs); compute score/award server-side; create one immutable receipt and update account gold/unlocks atomically with `ProfileRepository.applyRunOnce`; upsert personal best for score board and clear board only for `status='won'`; retry repairs board projection without awarding twice. Score tie-break is kills desc, elapsed desc, name asc. Return only first 10 public entries and separately compute caller rank from all board records.
- **Error & Exception Handling**: repeated `runId` returns the existing receipt without another gold award; invalid query/filter → 400; unknown board → empty entries with null rank; partial Cosmos failure returns 503 and logs runId/correlationId for retry. The client cannot choose caller ID or display name.

## Acceptance Criteria
- [ ] Account endpoints enforce caller identity and role and use versioned writes
- [ ] A run submission awards gold once and updates score/clear records
- [ ] Score/clear boards return at most 10 entries and calculate the caller’s rank outside the top ten
- [ ] API errors use stable codes and never return stack traces

## Validation
- `npm run test --workspace apps/api -- test/functions/profile-save.test.ts test/services/runService.test.ts test/functions/leaderboards.test.ts` — API behavior cases pass
- `npm run typecheck` — all API/contracts code typechecks

## Commit Message
```text
feat(api): add profile run save and leaderboard endpoints

Plan: 2026-10-21-caravan-escort-game
Phase: P01-foundation-api
Task: T04-game-api

- Add protected account and save endpoints
- Submit idempotent run rewards and query top-ten boards
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
