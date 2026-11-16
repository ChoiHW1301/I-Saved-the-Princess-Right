# Task: T01 마법진 범위·파괴와 매지션 변 중앙

## Status: done

## Goal
실제 폭발 반경 100px를 마법진의 표시·공격 판정 범위로 일치시키고, 공격 파괴 이펙트를 추가하며, 매지션을 화면 네 변 중앙에 출현·순간이동시킨다.

## Decision Summary
- 마법진 반경은 100 world px, art 지름은 200px, hit radius는 100px다. 기존 100px 폭발 피해 판정은 변경하지 않는다.
- 공격 파괴는 금빛/주황색 사각 픽셀 파편과 같은 반경의 짧은 원형 충격파를 낸다. timeout explosion flow remains unchanged.
- mage positions use the center of one random edge and `BOSS_COLLISION_RADIUS + 2` inset; positions are shared by initial spawn and HP threshold teleports.

## Implementation

### I01. 마법진 범위 일치 및 공격 파괴 연출

- Related Files:
  - `apps/web/src/game/entities/LavaSigil.ts` :: `LavaSigil.constructor`, `LavaSigil.hitRadius`, `advance`, `drawFuseRing`, `playDestroyEffect` — visual radius, attack radius, fragment effect; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `removeLavaSigil`, `advanceLavaSigils`, `detonateLavaSigil` — route weapon break to effect while keeping timeout explosion; modify
  - `apps/web/src/game/test/LavaSigil.test.ts` :: `lava sigil combat and fuse` — radius and one-hit break behavior; modify

#### Details
- Import and use `LAVA_SIGIL_EXPLOSION_RADIUS` (100) as `LavaSigil.hitRadius`.
- Display `lava-sigil` texture at 200×200 so its nominal circular diameter matches 2× explosion radius. Draw the fuse progress arc at radius 100, line width 3; it must share the same outer boundary as the visual sigil and blast circle.
- Draw a persistent thin `rangeOutline` circle at radius 100 over the sigil art. Keep existing `explosionWarning` fill/stroke circle at radius 100 and its visibility timing (last 300ms); it remains an urgency overlay, not the only indication of the range.
- Add public `playDestroyEffect(): void`. It captures the sigil world position, hides the sigil, emits 10 small square fragments colored alternating `0xffd36b`/`0xff7038` with radial offsets of 42–68px over 240–300ms, and creates a stroked circle at radius100 that scales from 0.15 to 1.0 and fades. Destroy the sigil container after effect has started; independent effects destroy themselves on tween completion. No effect writes to game state.
- In `CaravanScene.removeLavaSigil`, remove from `lavaSigils` and invoke `sigil.playDestroyEffect()` instead of immediately destroying. In `advanceLavaSigils`, keep current `destroy()` followed by `detonateLavaSigil()` for expired sigils. Thus attack-break effect does not call damage or fake an explosion.
- Verify unit values `hitRadius === LAVA_SIGIL_EXPLOSION_RADIUS` indirectly via exported constant/target contract if testing Phaser is unavailable; keep one-hit HP tests intact.

### I02. 매지션 네 변 중앙 시작 및 순간이동

- Related Files:
  - `apps/web/src/game/systems/BossGimmickSystem.ts` :: `chooseLavaMagicianTeleport` — select one of four center-edge coordinates; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `startBoss`, `resolveBossDamage` — use same edge selector for initial spawn and each 10%-HP teleport; modify
  - `apps/web/src/game/test/BossGimmickSystem.test.ts` :: edge location tests — verify all four deterministic options and inset; modify

#### Details
- Change selector signature to `chooseLavaMagicianTeleport(random: () => number, width: number, height: number): Vector2` and remove no-longer-used wagon argument. Generate `edge = floor(random()*4)`, `inset=BOSS_COLLISION_RADIUS+2`; return `0: {x:inset,y:height/2}`, `1:{x:width-inset,y:height/2}`, `2:{x:width/2,y:inset}`, `3:{x:width/2,y:height-inset}`.
- Use this function for both first spawn and threshold teleport so positions follow the same rule. As the wagon sits at screen center and all four inset positions lie beyond the enlarged wagon bounds, no candidate retry/fallback is needed.
- Add deterministic tests with random values `0`, `.25`, `.5`, `.75` and width 1280/height 960; expected points are `(94,480)`, `(1186,480)`, `(640,94)`, `(640,866)` when boss radius is 92.

## Acceptance Criteria
- [x] Sigil art is 200×200, range ring radius is 100, and hit radius equals explosion radius 100.
- [x] Weapon destruction visibly emits a radial pixel shard and ring effect, without applying blast damage.
- [x] Timeout still detonates and damages using the existing radius 100.
- [x] Mage spawn and teleport cover the four exact edge-center positions with 94px inset.
- [x] Focused tests, web typecheck and production build pass.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts src/game/test/LavaSigil.test.ts` — focused tests pass.
- `npm run typecheck --workspace @caravan/web` — web TS checks pass.
- `npm run build --workspace @caravan/web` — production build passes.

## Commit Message
```text
feat(game): align lava sigil range and mage edge placement

Plan: 2026-11-16-caravan-lava-sigil-area-centering
Phase: P01-sigil-and-mage-placement
Task: T01-sigil-area-and-center-edges

- Match sigil visuals and hit area to blast radius
- Add break shards and center mage at screen edges
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
