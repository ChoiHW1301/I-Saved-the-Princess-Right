# Task: T03 경험치와 판 안 레벨업

## Status: pending

## Goal
처치 보상으로 경험치를 모아 레벨업하고, 전투를 멈춘 상태에서 무작위 강화 3개 중 하나를 적용하는 판 안 성장 루프를 만든다.

## Decision Summary
- XP와 레벨은 한 판에만 존재한다. 레벨업 선택 창은 게임 시뮬레이션을 멈춘다.
- 강화 선택은 세 개의 서로 다른 유효 카드 중 하나이며, 이미 최대인 강화는 다시 제시하지 않는다.

## Implementation

### I01. Run state와 경험치/강화 도메인
- Related Files:
  - `packages/contracts/src/gameplay.ts` :: `RunState`, `UpgradeDefinition`, `UpgradeChoice`; shared gameplay contracts; new
  - `packages/contracts/src/index.ts` :: gameplay exports; modify
  - `apps/web/src/game/state/createRunState.ts` :: `createRunState`, `addExperience`; new
  - `apps/web/src/game/content/upgrades.ts` :: `UpgradeDefinition`, `upgradeCatalog`; new
  - `apps/web/src/game/systems/LevelSystem.ts` :: `LevelSystem.addXp`, `rollChoices`, `applyChoice`; new
  - `apps/web/src/game/test/LevelSystem.test.ts` :: XP and choice cases; new
- **Signatures & Types**:
  ```typescript
  export interface RunState { runId:string; status:RunStatus; elapsedSeconds:number; characterId:CharacterId;
    level:number; xp:number; xpToNext:number; karma:number; runGold:number; kills:number;
    selectedUpgradeIds:string[]; weaponLevels:Record<string,number>; pausedBy:'none'|'level-up'|'event'|'boss'|'network'; }
  export interface UpgradeDefinition { id:string; name:string; maxLevel:number; appliesTo:'hero'|'weapon'|'caravan';
    stat:string; values:number[]; weight:number; characterIds?:CharacterId[]; }
  export interface UpgradeChoice { id:string; nextLevel:number; value:number; }
  export function addExperience(state:RunState, amount:number):{state:RunState; levelUps:number};
  ```
- **Data & Schema Fields**: player level begins 1 and XP 0; threshold to advance from current level `n` is `floor(10 + 5*(n-1) + 2*(n-1)^2)` (level 1 requires 10 XP). Candidate catalog includes sword damage/range, hero max HP/reflect, movement speed, wagon max HP, and generic projectile damage/range. All values and XP formula live in content config for later balance.
- **Execution Flow / Logic**: accept positive integer XP; loop level transitions while XP meets threshold; when a level is gained, pause world and use run-seeded RNG to select up to three weighted eligible upgrades; player chooses one; apply its next level and resume. If fewer than three eligible upgrades remain, show available count.
- **Error & Exception Handling**: reject invalid/negative XP; ignore upgrade choice not in current pending choices; duplicate selection event is ignored; never emit more than one pending level-up overlay.

### I02. Level-up React overlay and game event bridge
- Related Files:
  - `apps/web/src/game/bridge/GameEventBus.ts` :: typed game/UI events; new
  - `apps/web/src/game/ui/LevelUpOverlay.tsx` :: `LevelUpOverlay` — three cards; new
  - `apps/web/src/game/GameCanvas.tsx` :: pause/resume bridge; modify
  - `apps/web/src/game/test/LevelUpOverlay.test.tsx` :: choice interactions; new
- **Data & Schema Fields**: event `level-up` payload contains `choices:UpgradeChoice[]`, `level:number`; choice command carries only `upgradeId` from current list.
- **Execution Flow / Logic**: Phaser emits pending choices; React renders overlay; keyboard number keys 1-3 and click select; bridge validates selected ID against payload and invokes `LevelSystem.applyChoice`; overlay closes only after successful apply.
- **Error & Exception Handling**: empty choice array resumes run with no selection; invalid UI command logs a development error and leaves game paused for a valid choice.

## Acceptance Criteria
- [ ] XP from enemy deaths increments levels using deterministic thresholds
- [ ] Every level-up pauses game, displays up to three valid options, and applies one exactly once
- [ ] XP/level/upgrades reset when a new run is created

## Validation
- `npm run test --workspace packages/contracts -- gameplay.test.ts` — gameplay DTO constraints pass
- `npm run test --workspace apps/web -- src/game/test/LevelSystem.test.ts src/game/test/LevelUpOverlay.test.tsx` — XP and overlay flows pass
- `npm run typecheck` — shared/game UI types pass

## Commit Message
```text
feat(game): add run XP and three-choice level ups

Plan: 2026-10-21-caravan-escort-game
Phase: P02-gameplay-core
Task: T03-run-progression

- Add run-only XP and deterministic level thresholds
- Pause combat for one-of-three upgrade selection
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
