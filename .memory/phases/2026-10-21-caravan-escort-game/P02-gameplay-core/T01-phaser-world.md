# Task: T01 Phaser 플레이 공간과 이동

## Status: pending

## Goal
중앙 마차와 플레이어를 보여주는 Phaser 플레이 화면을 React에 연결하고, 데스크톱 키보드 이동과 전진 배경을 제공한다.

## Decision Summary
- Phaser 3가 실시간 장면을 소유하고 React는 mount/unmount 및 HUD overlay만 담당한다.
- 마차는 뷰포트 중앙에 고정하고 타일 배경을 반대 방향으로 스크롤한다. 플레이어는 화면 경계 안에서 WASD/방향키로 이동한다.

## Implementation

### I01. Phaser scene와 world entities
- Related Files:
  - `apps/web/src/game/GameCanvas.tsx` :: `GameCanvas` — Phaser lifecycle; new
  - `apps/web/src/game/config/createGameConfig.ts` :: `createGameConfig` — fixed 16:9 scaling; new
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `CaravanScene` — world setup/update; new
  - `apps/web/src/game/entities/Caravan.ts` :: `Caravan` — center wagon; new
  - `apps/web/src/game/entities/Hero.ts` :: `Hero` — keyboard mover; new
  - `apps/web/src/game/systems/BackgroundScroll.ts` :: `BackgroundScroll` — forward travel; new
  - `apps/web/src/game/test/CaravanScene.test.ts` :: scene state tests; new
- **Signatures & Types**:
  ```typescript
  export interface RunWorldConfig { width:number; height:number; seed:number; }
  export class CaravanScene extends Phaser.Scene { create(data:RunWorldConfig):void; update(time:number,delta:number):void; }
  export class Hero extends Phaser.Physics.Arcade.Sprite { setInput(input:MovementInput):void; }
  export interface MovementInput { x:-1|0|1; y:-1|0|1; }
  ```
- **Data & Schema Fields**: base logical viewport 1280x720, scale `FIT` + center; wagon at `(640,360)` with fixed-to-camera/scene origin, hero starts `(640,470)`. Movement speed initial `220 px/s`; diagonal vector normalized; terrain config `castle`, `lava`, `meadow-village` loaded from `game/content/biomes.ts` (assets can begin as generated placeholder pixel textures).
- **Execution Flow / Logic**: React creates Phaser.Game on mount and destroys it on unmount; scene initializes deterministic seeded RNG and static wagon; keyboard updates normalized hero velocity; world background scrolls at configured travel speed; resize updates canvas without changing logical coordinates.
- **Error & Exception Handling**: missing texture falls back to built-in colored pixel placeholder; duplicate game instance is prevented with effect cleanup; focus loss clears held keys to prevent stuck movement.

### I02. World integration checks
- Related Files:
  - `apps/web/src/game/test/MovementInput.test.ts` :: diagonal and key mapping cases; new
- **Test Scenarios**: WASD와 방향키 매핑, 대각선 속도 정규화, 화면 가장자리 이동 clamp, React unmount 뒤 ticker/keyboard listener 해제.

## Acceptance Criteria
- [ ] 중앙 마차가 고정되고 배경만 이동하는 화면이 표시됨
- [ ] WASD와 방향키가 같은 이동을 제공하고 화면 밖으로 벗어나지 않음
- [ ] Phaser 리소스가 React unmount 때 정리됨

## Validation
- `npm run test --workspace apps/web -- src/game/test` — game world cases pass
- `npm run build --workspace apps/web` — web bundle builds

## Commit Message
```text
feat(game): add centered caravan world and keyboard movement

Plan: 2026-10-21-caravan-escort-game
Phase: P02-gameplay-core
Task: T01-phaser-world

- Embed Phaser scene in React lifecycle
- Add fixed caravan, scrolling terrain, and bounded keyboard movement
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
