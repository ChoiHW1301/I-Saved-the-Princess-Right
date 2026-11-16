# Task: T01 마차 겹침에 따른 마법진 깊이 설정

## Status: done

## Goal
마법진 원형 시각 범위가 마차 스프라이트 영역과 겹치면 렌더 깊이를 마차보다 낮춘다.

## Related Files
- `apps/web/src/game/scenes/CaravanScene.ts` :: restored sigil setup, `addLavaSigil`, new `positionLavaSigilLayer` helper — modify
- `apps/web/src/game/systems/LavaSigilSystem.ts` :: existing rectangle-circle overlap helper — reuse
- `apps/web/src/game/test/LavaSigil.test.ts` :: overlap condition tests — extend if a pure layer helper is added
- `.memory/decisions/2026-11-16-caravan-sigil-wagon-layer.md` :: confirmed layout

## Details
- Wagon image bounds are centered at `(WORLD_WIDTH / 2, ROAD_CENTER_Y)` with half-width 124 and half-height 71.
- Use the sigil range/explosion circle radius 100 to determine whether its visual range overlaps the wagon image rectangle.
- Overlap sets sigil depth to 5 (below the wagon's depth 6); otherwise preserve sigil depth 7.
- Apply the same depth rule for fresh summons and sigils restored from saves.
- Do not change damage, countdown, or overlap damage logic.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/LavaSigil.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Result
- 마차 그림과 마법진 반경이 겹칠 때만 깊이 5로 설정해 마차 뒤에 표시한다. 겹치지 않으면 깊이 7을 유지한다.
- 신규 소환과 저장 불러오기 모두 같은 레이어 규칙을 적용한다.
- 영역 겹침 테스트 10개 통과, 웹 typecheck 및 production build 통과.

## Commit Message
```text
fix(game): render wagon-overlapping sigils behind wagon

Plan: 2026-11-16-caravan-sigil-wagon-layer
Phase: P01-sigil-layer
Task: T01-sigil-depth

- Layer sigils below the wagon only when their visible area overlaps it
- Apply the same rule when resuming a saved run
```

