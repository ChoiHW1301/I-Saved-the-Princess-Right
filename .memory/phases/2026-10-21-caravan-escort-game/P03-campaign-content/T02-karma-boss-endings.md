# Task: T02 카르마 분기·보스전·엔딩

## Status: pending

## Goal
현재 카르마와 최종 카르마를 사용해 흑화 외형, 준보스와 최종전, 승패 후 결말을 일관되게 진행한다.

## Decision Summary
- Karma -100..100; evil ≤ -50, neutral -49..49, good ≥ 50. Current tier controls hero sprite; final tier selects ending.
- First version has two minibosses and three ending outcomes; event-specific boss registry is an extension point only, with no special boss content.

## Implementation

### I01. Karma tier, visual state, and boss director
- Related Files:
  - `packages/contracts/src/campaign.ts` :: `KarmaTier`, `BossId`, `EndingId`; new
  - `apps/web/src/game/systems/KarmaSystem.ts` :: `getKarmaTier`, `applyKarma`; new
  - `apps/web/src/game/content/bosses.ts` :: `BossDefinition`, `bossCatalog`; new
  - `apps/web/src/game/systems/BossDirector.ts` :: `startBoss`, `defeatBoss`; new
  - `apps/web/src/game/entities/Hero.ts` :: karma sprite swap; modify
  - `apps/web/src/game/test/KarmaAndBoss.test.ts` :: boundaries, pause, selection; new
- **Signatures & Types**:
  ```typescript
  export function getKarmaTier(karma:number):KarmaTier;
  export interface BossDefinition { id:string; kind:'miniboss'|'princess-demon'|'king-guard'; maxHp:number; damage:number; attacks:BossAttackDefinition[]; }
  export function chooseFinalBoss(tier:KarmaTier):'princess-demon'|'king-guard';
  export function applyKarma(current:number, delta:number):number;
  ```
- **Data & Schema Fields**: clamp karma to [-100,100]; evil hero skin is black/purple and changes immediately with current tier, reverting when tier is no longer evil. Miniboss IDs `castle-warlord`, `lava-behemoth`; good/neutral final ID `princess-demon`; evil final encounter ID `king-guard` (king plus soldier wave). Boss state stores `bossId`, `hp`, `phase`, `attackCooldownMs`, `alive`.
- **Execution Flow / Logic**: miniboss milestones start one active boss, freeze clock and ordinary spawns; retain living normal enemies. On defeat mark ID, reward, resume clock/spawns. Final boss clears normal enemies, freezes clock/spawns; choose by final karma; defeat produces ending ID and stops run. Keep `SpecialBossRule` interface `{eventChoiceId:string; requiredKarmaTier?:KarmaTier; bossId:BossId; priority:number}` unpopulated for extension.
- **Error & Exception Handling**: no overlapping boss instances; unknown boss content sets run to recoverable content-error state; boss defeat event idempotent; event override not evaluated until a rule exists.

### I02. Ending resolution and result payload
- Related Files:
  - `apps/web/src/game/content/endings.ts` :: `EndingDefinition`, `endingCatalog`; new
  - `apps/web/src/game/systems/EndingSystem.ts` :: `resolveEnding`; new
  - `apps/web/src/game/ui/EndingPanel.tsx` :: `EndingPanel`; new
  - `apps/web/src/game/test/EndingSystem.test.ts` :: all ending combinations; new
- **Signatures & Types**:
  ```typescript
  export type EndingId = 'princess-purified'|'princess-died'|'hero-new-demon-king'|'caravan-lost';
  export function resolveEnding(status:RunStatus, finalKarma:number, finalBossId?:BossId):EndingDefinition;
  ```
- **Data & Schema Fields**: good boss victory → `princess-purified`; neutral boss victory → `princess-died`; evil king/guards victory → `hero-new-demon-king`; wagon HP zero → `caravan-lost`. Ending UI stores final karma tier and ending ID in `RunSummary`.
- **Execution Flow / Logic**: resolve once when run enters `won` or `lost`; display title/body/character art and reward summary; on Continue return result for P04 API submission.
- **Error & Exception Handling**: unknown tier maps to neutral only after validation rejects invalid karma; no ending resolver call for active run.

## Acceptance Criteria
- [ ] Karma boundaries classify exactly and clamp event changes
- [ ] Good/neutral use princess demon; evil uses king and soldiers
- [ ] Good victory purifies princess; neutral victory kills her; evil victory makes hero new demon king
- [ ] Current visual follows current karma; ending follows final run karma

## Validation
- `npm run test --workspace apps/web -- src/game/test/KarmaAndBoss.test.ts src/game/test/EndingSystem.test.ts` — all boundary/endings pass
- `npm run typecheck` — campaign types pass

## Commit Message
```text
feat(campaign): add karma routes bosses and endings

Plan: 2026-10-21-caravan-escort-game
Phase: P03-campaign-content
Task: T02-karma-boss-endings

- Add karma tiers and route-specific final encounters
- Add princess, king, and lost-caravan endings
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
