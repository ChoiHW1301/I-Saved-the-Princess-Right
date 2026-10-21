# Task: T01 캠페인 시계·지역·이벤트 일정

## Status: done

## Goal
실제 플레이 타이머에 따라 세 지역, 배경 전환, 네 번의 일시 정지 이벤트, 두 준보스와 최종 보스 발생 시점을 결정한다.

## Decision Summary
- 이벤트: 180, 360, 540, 720초. 준보스: 300, 600초. 최종전: 900초.
- 보스가 살아 있는 동안 elapsed time과 일반 spawn을 멈춘다. 이벤트 선택 화면도 시뮬레이션을 멈춘다.

## Implementation

### I01. 데이터 기반 일정과 바이옴 전환
- Related Files:
  - `apps/web/src/game/content/biomes.ts` :: `BiomeDefinition`, `biomeSchedule`; new
  - `apps/web/src/game/content/campaignSchedule.ts` :: `CampaignSchedule`, event/boss milestones; new
  - `apps/web/src/game/systems/CampaignClock.ts` :: `CampaignClock.update`, `pause`, `resume`; new
  - `apps/web/src/game/systems/BiomeTransitionSystem.ts` :: `getBiomeAt`, `transitionProgress`; new
  - `apps/web/src/game/test/CampaignClock.test.ts` :: schedule boundaries; new
- **Signatures & Types**:
  ```typescript
  export type StageId = 'demon-castle'|'lava-fields'|'meadow-village';
  export interface CampaignMilestone { atSeconds:number; kind:'event'|'miniboss'|'final-boss'; id:string; }
  export interface CampaignClock { elapsedSeconds:number; pausedReason:string|null; update(deltaMs:number):CampaignMilestone[]; }
  export function getBiomeAt(elapsedSeconds:number):{from:StageId;to:StageId;progress:number};
  ```
- **Data & Schema Fields**: stages: demon castle from 0 to 270s; crossfade to lava 270..300s; lava until 570s; crossfade to meadow-village 570..600s; meadow-village through 900s. Milestones use absolute in-game seconds. Event cards fire at 180/360/540/720; minis at 300/600; final at 900.
- **Execution Flow / Logic**: `update(deltaMs)` emits each due milestone once; when event or boss pauses, wall-clock delta is ignored; crossing 270 or 570 begins 30-second biome transition; complete transition clamps progress to 1. Boss pause resumes only after matching boss-defeated command.
- **Error & Exception Handling**: duplicate milestones are prevented with an emitted-ID set; loading an invalid schedule fails content validation; negative delta is ignored.

### I02. Yes/No event content and pause UI bridge
- Related Files:
  - `apps/web/src/game/content/events.ts` :: `StoryEvent`, `eventCatalog`; new
  - `apps/web/src/game/systems/EventSystem.ts` :: `EventSystem.present`, `choose`; new
  - `apps/web/src/game/ui/EventChoiceOverlay.tsx` :: `EventChoiceOverlay`; new
  - `apps/web/src/game/test/EventSystem.test.ts` :: pause/outcome tests; new
- **Signatures & Types**:
  ```typescript
  export interface EventChoice { id:'yes'|'no'; label:'Yes'|'No'; karmaDelta:number; wagonHpDelta:number; goldDelta:number; }
  export interface StoryEvent { id:string; atSeconds:number; title:string; body:string; yes:EventChoice; no:EventChoice; }
  export function choose(eventId:string, choiceId:'yes'|'no'):EventOutcome;
  ```
- **Data & Schema Fields**: initial catalog contains four events, one per event milestone; each has title/body, exactly Yes and No choices, karmaDelta integer clamped to [-100,100], wagonHpDelta and goldDelta integers. Keep texts and effects in data file, not scene code. Choice effects are context-specific; neither label maps globally to good/evil.
- **Execution Flow / Logic**: present event pauses all gameplay; apply selected event result once; clamp wagon HP to max and karma to range; persist event choice ID in run state; close overlay and resume.
- **Error & Exception Handling**: missing event ID or duplicate choice cannot mutate state; if no valid choice exists, maintain pause and surface content error.

## Acceptance Criteria
- [x] All milestones fire once at the specified game times
- [x] Biome crossfades begin 30 seconds before each miniboss and finish at arrival
- [x] Event choice pauses combat and applies only the selected outcome

## Validation
- `npm run test --workspace apps/web -- src/game/test/CampaignClock.test.ts src/game/test/EventSystem.test.ts` — milestone, pause, and outcome cases pass
- `npm run typecheck` — campaign content types pass

## Commit Message
```text
feat(campaign): add timed biomes and moral events

Plan: 2026-10-21-caravan-escort-game
Phase: P03-campaign-content
Task: T01-campaign-schedule-events

- Add 15-minute schedule and 30-second biome crossfades
- Add paused Yes/No events with contextual karma and rewards
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
