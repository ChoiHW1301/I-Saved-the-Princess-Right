# Task: T01 돌진속도 및 실제 마법진 타격 검증

## Status: done

## Goal
용암 거인의 돌진속도를 864 월드픽셀/초로 바꾸고, WeaponSystem의 공격 판정이 HP 1 마법진을 파괴하는 것을 검증한다.

## Related Files
- `apps/web/src/game/systems/BossGimmickSystem.ts` :: `LAVA_GIANT_CHARGE_SPEED`
- `apps/web/src/game/test/BossGimmickSystem.test.ts` :: 돌진 상수 검증
- `apps/web/src/game/test/LavaSigil.test.ts` :: 실제 `WeaponSystem.update` -> `applyLavaSigilHit` -> 제거 콜백 경로 검증
- `.memory/decisions/2026-11-16-caravan-giant-speed-sigil-hit.md` :: 확정 요구사항

## Details
- `1080 * 0.8 = 864`로 속도를 변경한다.
- HP 1인 타겟을 공격 궤적 안에 놓고, 전사의 검 공격 한 번으로 `dead=true`가 되며 제거 콜백이 한 번 호출되는 테스트를 둔다.
- 기존 직접 피해 함수 테스트와 구분하여 실제 무기 판정 경로를 검증한다.
- 테스트가 통과하면 코드상 단일 유효 타격은 정상이며, 명중 조건은 공격 궤적/방향 및 무기 범위라고 결론낸다. 실패하면 최소 수정 후 회귀 테스트를 갱신한다.

## Findings
- 실제 WeaponSystem 단일타격 테스트 통과: 유효한 공격선이 HP 1 타겟을 맞히면 `applyLavaSigilHit`가 1 피해를 주고, `killed` 결과를 통해 제거 콜백이 호출된다. 다중 타격이 필요한 결함은 재현되지 않았다.
- 공격 판정은 방향과 무기별 사거리를 따른다. 검은 전방 125px 반원, 원거리/마법 공격은 조준선이 마법진 원형 타격반경(100px)을 통과해야 한다. 따라서 화면상 공격 모션만으로 마법진 타격이 보장되지는 않는다.

## Validation
- `npm test --workspace @caravan/web -- --run src/game/test/BossGimmickSystem.test.ts src/game/test/LavaSigil.test.ts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`

- [x] Focused tests: 14 passed.
- [x] Web typecheck passed.
- [x] Web production build passed.

## Commit Message
```text
fix(game): reduce lava giant speed and verify sigil hits

Plan: 2026-11-16-caravan-giant-speed-sigil-hit
Phase: P01-charge-and-sigil-hit
Task: T01-charge-speed-and-sigil-hit

- Reduce charge speed by twenty percent
- Cover the weapon-to-sigil destruction path
```


