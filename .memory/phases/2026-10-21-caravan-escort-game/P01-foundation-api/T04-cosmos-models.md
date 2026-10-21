# Task: T04 공유 데이터 계약과 Cosmos 저장소

## Status: pending

## Goal
계정 진행, 이어하기 저장, 랭킹의 데이터 구조와 Cosmos DB 접근 계층을 정의해 API가 사용할 저장 기반을 만든다.

## Decision Summary
- Cosmos DB for NoSQL의 database `caravan-game`과 `profiles`, `saves`, `leaderboards` 컨테이너를 사용한다.
- 사용자 식별자는 검증된 Entra `tenantId:objectId`; Cosmos 인증은 Function 관리 ID와 `DefaultAzureCredential`을 사용한다.

## Implementation

### I01. 공용 DTO 및 저장 스키마
- Related Files:
  - `packages/contracts/src/profile.ts` :: `PlayerProfile`, `MetaUpgradeId`; profile DTO; new
  - `packages/contracts/src/save.ts` :: `CurrentRunSaveV1`, nested snapshot types; save DTO; new
  - `packages/contracts/src/leaderboard.ts` :: `LeaderboardEntry`, `RunReceiptDocument`, `KarmaTier`; ranking DTO; new
  - `packages/contracts/src/index.ts` :: exports; modify
  - `packages/contracts/test/schema.test.ts` :: schema validation; new
- **Signatures & Types**:
  ```typescript
  export interface PlayerProfile { id: 'profile'; userId: string; tenantId: string; objectId: string; version:number;
    displayName: string; goldBalance: number; unlockedCharacters: CharacterId[];
    permanentUpgradeLevels: Record<string, number>; passiveIds: string[]; updatedAt: string; }
  export interface CurrentRunSaveV1 { id: 'current'; userId: string; schemaVersion: 1; revision: number;
    runId: string; savedAt: string; snapshot: RunSnapshotV1; }
  export interface RunReceiptDocument { id:string; userId:string; runId:string; score:number; goldAward:number;
    status:'won'|'lost'; endingId:EndingId; createdAt:string; }
  export interface LeaderboardEntry { id: string; boardId: string; userId: string; displayName: string;
    score: number; characterId: CharacterId; karmaTier: KarmaTier; elapsedSeconds: number;
    clear: boolean; updatedAt: string; }
  ```
- **Data & Schema Fields**: `RunSnapshotV1` includes `elapsedSeconds`, `stageId`, `rngSeed`, `karma`, `status`, `pendingEventId|null`, `eventChoiceIds:string[]`, `ordinarySpawnCooldownMs`, `activeBoss|null`, player `{x,y,hp,level,xp,respawnMs,invulnerableMs}`, wagon `{hp,maxHp}`, `runGold`, `weaponLevels`, `upgradeIds`, `defeatedBossIds`, enemy list `{id,typeId,x,y,hp,attackCooldownMs}`, and projectile list `{id,ownerId,x,y,vx,vy,damage,ttlMs}`. All persisted dates are ISO strings; counters are finite non-negative integers except karma (-100..100).
- **Execution Flow / Logic**: schema validation rejects unsupported `schemaVersion`, invalid IDs, non-finite numbers, arrays above caps (enemies 500, projectiles 500), missing required nested fields, and payloads above 1 MB. API DTOs never contain Cosmos `_etag` as a client-editable field.
- **Error & Exception Handling**: invalid data returns typed validation issues; unsupported save version returns `SAVE_VERSION_UNSUPPORTED`; no partial write occurs.

### I02. Cosmos client and repository
- Related Files:
  - `apps/api/src/data/cosmosClient.ts` :: `getCosmosClient` — lazy managed identity client; new
  - `apps/api/src/data/profileRepository.ts` :: `ProfileRepository` — partitioned profile CRUD; new
  - `apps/api/src/data/saveRepository.ts` :: `SaveRepository` — ETag conditional save/load/delete; new
  - `apps/api/src/data/leaderboardRepository.ts` :: `LeaderboardRepository` — per-board upsert/query; new
  - `apps/api/test/data/repositories.test.ts` :: repository contract cases; new
- **Signatures & Types**:
  ```typescript
  export interface ProfileRepository { getOrCreate(caller: Caller): Promise<PlayerProfile>; save(profile: PlayerProfile): Promise<void>;
    applyRunOnce(caller:Caller, receipt:RunReceiptDocument, updatedProfile:PlayerProfile):Promise<boolean>; }
  export interface SaveRepository { get(userId: string): Promise<CurrentRunSaveV1 | null>;
    put(save: CurrentRunSaveV1, expectedRevision: number | null): Promise<CurrentRunSaveV1>;
    delete(userId: string, expectedRevision: number): Promise<void>; }
  export interface LeaderboardRepository { upsertBest(entry: LeaderboardEntry): Promise<void>; }
  ```
- **Data & Schema Fields**: partition key `profiles=/userId`, `saves=/userId`, `leaderboards=/boardId`. `profiles` stores the `id='profile'` document and immutable run receipts (`id='run:{runId}'`) in the same user partition so one transactional batch can update profile gold and create its receipt. Save `revision` increments by one; request uses prior revision, and Cosmos ETag provides optimistic concurrency. `leaderboards.id` is `userId` for one best record per user per board; `boardId` is `score` or `clear:{characterId}:{karmaTier}`.
- **Execution Flow / Logic**: client is initialized once per Function process using `COSMOS_ENDPOINT` and managed identity; repository methods map Cosmos documents to contracts; `applyRunOnce` transactionally creates run receipt plus profile update in the `profiles` partition; leaderboard queries sort score descending, elapsed seconds ascending, display name ascending.
- **Error & Exception Handling**: 404 maps to `null`; ETag mismatch maps to `SAVE_CONFLICT`; Cosmos throttling retries use SDK retry policy; unavailable database propagates `STORAGE_UNAVAILABLE` without leaking endpoint/credentials.

## Acceptance Criteria
- [ ] Shared DTO validation accepts valid profile/save/entry and rejects malformed/oversized payloads
- [ ] Repositories use the stated partition keys and optimistic save revision
- [ ] No Cosmos key or secret is placed in browser configuration

## Validation
- `npm run test --workspace packages/contracts` — schema cases pass
- `npm run test --workspace apps/api -- test/data/repositories.test.ts` — repository contract cases pass with mocked Cosmos client
- `npm run typecheck` — contracts and API typecheck cleanly

## Commit Message
```text
feat(data): define account save and leaderboard persistence

Plan: 2026-10-21-caravan-escort-game
Phase: P01-foundation-api
Task: T04-cosmos-models

- Add versioned game save and account DTOs
- Add Cosmos repositories with partitioning and concurrency checks
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
