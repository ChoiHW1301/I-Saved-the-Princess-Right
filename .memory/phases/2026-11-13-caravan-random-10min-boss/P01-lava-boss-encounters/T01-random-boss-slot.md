# Task: T01 Random Boss Slots

## Status: done

## Goal
5분에는 용암 거인·라바 매지션 중 하나를 seeded RNG로 선택하고, 10분에는 성채 장군 더미를 배치한다. 슬롯 ID와 실제 보스 ID를 분리해 저장하며, 보스전 중 시간·맵 전환을 멈추고 처치 뒤에만 전환하도록 캠페인·저장 진행을 연결한다.

## Decision Summary
- 전체 보스는 5분 랜덤 용암 보스, 10분 성채 장군 더미, 15분 숲 수호자, 20분 카르마별 최종 보스다.
- 활성 보스 슬롯 ID와 실제 `BossId`를 따로 보존한다. 구형 v1 저장은 기존 슬롯/처치 ID에서 완료 슬롯 ID를 마이그레이션한다.

## Implementation

### I01. 보스 식별자·속도·무작위 선택

- Related Files:
  - `packages/contracts/src/leaderboard.ts` :: `BossIdSchema`, `BossId` — 신규 보스의 저장·결과 ID 추가; modify
  - `apps/web/src/game/content/bosses.ts` :: `BossDefinition`, `bossCatalog`, `chooseLavaBoss` — 보스 정의와 선택기; modify
  - `apps/web/src/game/test/KarmaAndBoss.test.ts` — 선택기 경계와 BossDirector 기존 동작; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export const BossIdSchema = z.enum([
    'castle-warlord', 'lava-behemoth', 'lava-giant', 'lava-magician',
    'forest-warden', 'princess-demon', 'king-guard',
  ]);
  export type BossId = z.infer<typeof BossIdSchema>;

  export interface BossAttackDefinition { id: string; damage: number; range: number; cooldownMs: number }
  export interface BossDefinition {
    id: BossId;
    kind: 'miniboss' | 'princess-demon' | 'king-guard';
    maxHp: number;
    speed: number;
    damage: number;
    attacks: readonly BossAttackDefinition[];
    color: number;
  }
  export function chooseLavaBoss(random: () => number): 'lava-giant' | 'lava-magician';
  ```
- **Data & Schema Fields**:
  - `BossDefinition.speed`: 월드픽셀/초. 모든 미니보스(`castle-warlord`, `lava-behemoth`, `lava-giant`, `lava-magician`, `forest-warden`)는 42, 최종보스(`princess-demon`, `king-guard`)는 48.
  - 신규 `lava-giant`, `lava-magician`: `kind:'miniboss'`, `maxHp:220`, `speed:42`, `damage:20`, `attacks:melee(20)`. `lava-behemoth` 구형 저장 카탈로그 항목은 유지한다.
- **Execution Flow / Logic**:
  1. `chooseLavaBoss(random)`는 RNG를 정확히 한 번 호출한다. 유한 난수가 `<0.5`면 `lava-giant`, 그 외(0.5 포함)는 `lava-magician`이다.
  2. 나머지 BossId와 최종 보스 카르마 분기는 그대로 둔다.
  3. `CaravanScene.startBoss` 신규 생성과 `enemyDefinition` 저장 복원은 모두 `bossCatalog[id].speed`를 사용한다. 중간 보스 42, 최종 보스 48을 유지한다.
  4. 검증 입력은 `0`, `0.499999`, `0.5`, `0.999999`; 각 호출은 난수 함수가 한 번 호출됐는지 확인한다.

### I02. 일정 슬롯 정의와 바이옴 진행

- Related Files:
  - `apps/web/src/game/content/campaignSchedule.ts` :: `CampaignMilestone`, `campaignSchedule`, `validateCampaignSchedule` — 보스 슬롯과 실제 ID 분리; modify
  - `apps/web/src/game/content/biomes.ts` :: `BiomeDefinition`, `biomeSchedule` — 바이옴 전환을 슬롯 완료 ID에 연결; modify
  - `apps/web/src/game/systems/BiomeTransitionSystem.ts` :: `getBiomeAt` — 슬롯 기반 전환 판정; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `startBoss` — 슬롯에서 실제 보스 ID 선택; modify
  - `apps/web/src/game/test/CampaignClock.test.ts` — 새 시간표와 전환 정지·재개; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export type CampaignMilestoneKind = 'event' | 'miniboss' | 'final-boss';
  export interface CampaignMilestone {
    atSeconds: number;
    kind: CampaignMilestoneKind;
    id: string;
    bossId?: BossId;
  }

  export interface BiomeDefinition {
    id: StageId;
    title: string;
    fromSeconds: number;
    afterBossMilestoneId?: string;
    afterBossId?: BossId;
    primaryColor: number;
    alternateColor: number;
    roadColor: number;
    accentColor: number;
  }
  export function getBiomeAt(
    elapsedSeconds: number,
    defeatedBossIds?: readonly string[],
    defeatedBossMilestoneIds?: readonly string[],
  ): BiomeTransition;
  ```
- **Data & Schema Fields**:
  - `campaignSchedule` boss entries:
    - `{ atSeconds:300, kind:'miniboss', id:'lava-5min-slot' }` — actual boss selected randomly.
    - `{ atSeconds:600, kind:'miniboss', id:'castle-warlord-10min', bossId:'castle-warlord' }` — temporary Castle Warlord dummy.
    - `{ atSeconds:900, kind:'miniboss', id:'forest-warden', bossId:'forest-warden' }`.
    - `{ atSeconds:1200, kind:'final-boss', id:'princess-demon' }` — actual final boss still selected by karma.
  - `BiomeDefinition.afterBossMilestoneId`: only a defeated slot marker opens a new stage. `lava-5min-slot` opens `demon-castle`; `castle-warlord-10min` opens `enchanted-forest`; `forest-warden` opens `meadow-village`. Keep existing colors and 30-second fade duration.
  - `CampaignMilestone.bossId` is present only for fixed minibosses. The 5-minute random slot identifies its candidate pool by slot ID. `startBoss` maps `lava-5min-slot` through `chooseLavaBoss`, otherwise uses `bossId ?? id`; final selection continues to use `chooseFinalBoss`.
- **Execution Flow / Logic**:
  1. Keep all event times unchanged. Replace 300-second Warlord with the lava random slot, replace 600-second Lava Behemoth with the Warlord dummy, keep 900-second Forest Warden and 1200-second final boss.
  2. `CampaignClock.pause('boss:' + milestone.id)` remains active while a miniboss lives, so elapsed campaign time cannot reach another time-based transition. Do not change existing behavior that retains ordinary monsters but stops new spawns during a miniboss.
  3. `getBiomeAt` evaluates `afterBossMilestoneId` against the defeated marker list. While the 5-minute or 10-minute boss is active, its slot has no defeated marker, so its transition cannot start. `completeBoss` adds the active slot marker only after `BossDirector.defeatBoss` succeeds, resumes the matching clock reason, then the 30-second transition begins from the unchanged elapsed time.
  4. If a `BiomeDefinition` has no `afterBossMilestoneId`, retain legacy `afterBossId` behavior for unrelated callers; the three campaign transitions in this schedule use slot markers.
  5. `validateCampaignSchedule` still requires strictly increasing times and unique slot IDs. Validate optional `bossId` only on `kind:'miniboss'`.

### I03. 슬롯 완료 저장과 구형 저장 마이그레이션

- Related Files:
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema` — 슬롯 완료 marker list; modify
  - `apps/web/src/game/systems/CampaignProgressMigration.ts` :: `migrateDefeatedMilestoneIds`, `getRestoredMilestoneId` — 구형 저장 진행 변환; new
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot` — marker persist 및 stage 계산; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `completeBoss`, `createRunSnapshot` — 완료·활성 슬롯 복원과 기록; modify
  - `packages/contracts/test/schema.test.ts` — 신규 marker 필드와 구형 strict snapshot parse; modify
  - `apps/web/src/game/test/CampaignClock.test.ts` — migration/slot resume; modify
  - `apps/web/src/features/run/SaveResume.test.ts` — snapshot marker round-trip; modify

#### Details
- **Signatures & Types**:
  ```typescript
  // RunSnapshotV1Schema field:
  defeatedBossMilestoneIds: z.array(IdSchema).max(100).default([]),

  export function migrateDefeatedMilestoneIds(snapshot: RunSnapshotV1): string[];
  export function getRestoredMilestoneId(snapshot: RunSnapshotV1): string | null;

  export interface SnapshotInput {
    // retain all existing fields
    defeatedBossMilestoneIds?: readonly string[];
  }
  ```
- **Data & Schema Fields**:
  - `RunSnapshotV1.defeatedBossMilestoneIds: string[]`, maximum 100, default `[]`; use `IdSchema`; save contract remains schema version 1.
  - `SnapshotInput.defeatedBossMilestoneIds` supplies current scene's completed-slot IDs. New snapshots always save the set, including an empty set when no miniboss has been defeated.
- **Execution Flow / Logic**:
  1. `migrateDefeatedMilestoneIds` returns a copy of non-empty saved marker arrays unchanged. If the array is empty (legacy v1 save), infer only from elapsed time and actual defeated IDs: at/after 300 seconds, `castle-warlord` implies old `lava-5min-slot` completion; at/after 600 seconds, `lava-behemoth` implies old `castle-warlord-10min` completion; at/after 900 seconds, `forest-warden` implies `forest-warden` completion.
  2. Never migrate the active boss itself to defeated. `getRestoredMilestoneId` maps legacy active slot `castle-warlord` at elapsed 300 to `lava-5min-slot`; legacy `lava-behemoth` at elapsed 600+ maps to `castle-warlord-10min`; all current slot IDs pass through unchanged.
  3. During scene create, initialize `defeatedBossMilestoneIds` from migration. For `CampaignClock` emitted IDs, mark past events from their existing event choice state; mark current-format bosses from saved markers or exact active slot; apply the legacy active mapping above. Never re-spawn the 5-minute random boss into an old active 5-minute Warlord save or the 10-minute dummy into an old active 10-minute Lava Behemoth save.
  4. Restore active enemy `bossMilestoneId`, `activeBossMilestoneId`, and paused reason using `getRestoredMilestoneId`; keep actual `snapshot.activeBoss.typeId` for `BossDirector` and enemy definition. Re-saving writes the normalized current slot ID and marker array.
  5. On successful boss completion, add `activeBossMilestoneId` to the marker set exactly once before checkpoint snapshot. Do not add a marker when `BossDirector.defeatBoss` fails.
  6. `createSnapshot` computes `stageId` through `getBiomeAt(run.elapsedSeconds, run.defeatedBossIds, input.defeatedBossMilestoneIds)` and serializes the same marker list. Legacy absent field parses as empty and is migrated in the scene.

## Acceptance Criteria
- [x] At 300 seconds the selected boss is one of `lava-giant`/`lava-magician`; at 600 seconds the fixed `castle-warlord` dummy appears; 900 and 1200 second bosses remain unchanged.
- [x] During each miniboss encounter, `CampaignClock.elapsedSeconds` stays fixed, no next timed event/spawn starts, and no biome transition begins. After defeat the clock resumes and only the corresponding marker unlocks the next 30-second biome transition.
- [x] A single run may defeat the 5-minute lava variant and the 10-minute Castle Warlord; both actual BossIds and both unique milestone IDs are recorded without conflation.
- [x] Old active/defeated 5-minute Castle Warlord and 10-minute Lava Behemoth saves do not re-emit the already-reached slot; after re-saving, current slot IDs and markers are persisted.
- [x] Existing final-boss karma routing, old `lava-behemoth` catalog restore, and boss start/restore speeds (42 miniboss, 48 final) remain valid.

## Validation
- `npm run test --workspace @caravan/contracts -- test/schema.test.ts` — older v1 snapshots default marker IDs to `[]`; new marker lists validate.
- `npm run test --workspace @caravan/web -- src/game/test/KarmaAndBoss.test.ts src/game/test/CampaignClock.test.ts src/features/run/SaveResume.test.ts` — selection, 4-slot campaign, transition gate, migration and save round-trip pass.
- `npm run typecheck --workspace @caravan/web` — boss-slot and snapshot types pass.

## Commit Message
```text
feat(game): add five-minute random lava boss slot

Plan: 2026-11-13-caravan-random-10min-boss
Phase: P01-lava-boss-encounters
Task: T01-random-boss-slot

- Randomize Lava Giant or Lava Magician at five minutes
- Use Castle Warlord as the ten-minute placeholder boss
- Persist unique milestone completion and pause transitions during miniboss fights
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in Git history
