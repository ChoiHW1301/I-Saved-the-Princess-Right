# Task: T01 매지션 순간이동 연출과 이름 배너 위치

## Status: done

## Goal
텔레포트 전후 시각 효과를 분리해 알아보기 쉽게 하고 보스 이름을 화면 하단에 표시한다.

## Related Files
- `apps/web/src/game/scenes/CaravanScene.ts` :: `resolveBossDamage`, new teleport effect helpers — modify
- `apps/web/src/game/GameCanvas.tsx` :: `bossEncounter` banner — move from center to bottom
- `.memory/decisions/2026-11-16-caravan-magician-teleport-presentation.md` :: presentation decisions

## Details
- Fade and shrink the magician at its current position, move it only after vanish completes, then play a fiery particle/ring effect and fade/scale it in.
- Queue the latest teleport destination if another HP threshold is crossed while an animation is active; play it after the current appearance.
- Keep boss names centered horizontally and position the banner 14px above the bottom edge.

## Validation
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Result
- 순간이동 시 축소·페이드아웃 후 목적지 이동, 용암빛 원형 파편 효과와 페이드인으로 재등장.
- 연출 중 추가 텔레포트 목적지를 대기시켜 연속 효과가 겹치지 않게 처리.
- 보스 조우 이름 표시를 화면 하단 중앙으로 이동.
- Web typecheck와 production build 통과.

## Commit Message
```text
feat(game): animate lava magician teleports

Plan: 2026-11-16-caravan-magician-teleport-presentation
Phase: P01-teleport-and-banner
Task: T01-magician-teleport-presentation

- Add vanish and reappear effects for the lava magician
- Move the boss encounter banner to the bottom edge
```

