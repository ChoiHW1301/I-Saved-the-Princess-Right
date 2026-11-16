# Task: T01 텔레포트 중복 제외 및 저체력 추가 소환

## Status: done

## Goal
라바 매지션이 현재 위치로 텔레포트하지 않게 하고, 체력이 50% 이하일 때 플레이어 위치에도 마법진을 생성한다.

## Related Files
- `apps/web/src/game/systems/BossGimmickSystem.ts` :: `chooseLavaMagicianTeleport`, new half-health sigil predicate
- `apps/web/src/game/scenes/CaravanScene.ts` :: `resolveBossDamage`, `teleportMagician`, mage sigil summon branch
- `apps/web/src/game/test/BossGimmickSystem.test.ts` :: destination exclusion and half-health threshold tests
- `.memory/decisions/2026-11-16-caravan-magician-pressure-teleport.md` :: confirmed decisions

## Details
- Filter teleport edge-center candidates whose coordinates match any supplied avoided positions; if no valid candidates remain, return a clamped non-identical fallback.
- When teleports queue during the visual transition, exclude current, active target, and already queued target positions.
- Add one additional sigil at the current player coordinates for every regular summon cycle when `hp <= maxHp * 0.5`; keep the existing random sigil as well.
- Boundary test at exactly 50% and just above it.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

## Result
- 현재/진행 중/대기 중인 텔레포트 목적지를 후보에서 제외한다.
- HP가 정확히 50% 이하이면 기존 랜덤 마법진에 더해 플레이어 위치에 하나를 추가 소환한다. 플레이어 사망 중에는 표적 마법진을 생략한다.
- 보스 기믹 테스트 8개, 웹 typecheck, production build 통과.

## Commit Message
```text
feat(game): add low-health mage pressure patterns

Plan: 2026-11-16-caravan-magician-pressure-teleport
Phase: P01-magician-pressure
Task: T01-magician-pressure

- Exclude current and in-flight teleport locations
- Add a player-targeted sigil below half mage health
```

