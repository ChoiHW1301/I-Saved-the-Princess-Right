# Task: T03 네 진화 트리의 전투 효과

## Status: done

## Goal
전사가 선택한 훨윈드·N도류·검기·선봉장의 실제 적중 방식, 성장 수치, 화면 연출을 구현한다. 기본 검·다른 캐릭터·기존 보스 기믹을 보존한다.

## Decision Summary
- 훨윈드는 기본 베기를 회전 범위 공격으로 교체한다. N도류는 주기당 2~5개 연속 참격이다. 검기는 기본 베기에 화면 끝까지 날아가는 투사체를 추가한다.
- 선봉장은 기본 HP를 제외한 체력 증가분·체력 재생·가시 갑옷 반사 피해를 2배로 하고, 반경 150에 0.5초당 2~12 열기 피해를 준다.

## Implementation

### I01. 검 계열 진화 피해 처리
- Related Files:
  - `apps/web/src/game/systems/WeaponSystem.ts` :: `update`, 전사 검 공격 분기 — 훨윈드·N도류·검기 생성과 실제 피해 처리; modify
  - `apps/web/src/game/content/weapons.ts` :: `weaponCatalog['sword']` — 기본 피해 12, 간격 1500ms, 사거리 125 유지; read-only
  - `apps/web/src/game/systems/CombatSystem.ts` :: `rollCriticalDamage`, `resolveHit`, `WeaponAttackTarget` — 기존 적중·치명타 처리 재사용; read-only
  - `apps/web/src/game/test/WarriorEvolutionCombat.test.ts` :: 트리별 공격 수·피해·적중 제한 검증; new

#### Details
- **Signatures & Types**:
  ```typescript
  // pure calculation helpers in apps/web/src/game/systems/WarriorEvolutionCombat.ts
  export function getWhirlwindIntervalMs(attackSpeedBonus: number): number;
  export function getWhirlwindDamageRatio(rank: number): number;
  export function getMultiSwordStrikeCount(rank: number): number;
  export function getSwordWaveHitProfile(hitIndex: number): { damageRatio: number; sizeRatio: number };
  // WeaponSystem.update retains its public signature and callback conventions.
  ```
- **Data & Schema Fields**: `run.warriorEvolutionId`는 T01 ID. 강화 수치는 `upgradeStats['whirlwind-damage-ratio']`(0~0.5), `['multi-sword-count']`(0~3), `['sword-wave-penetration']`(0~4). 검 기본 피해는 기존 공식 `(12 + sword-damage) * character.damageMultiplier * (1 + global-damage-multiplier)`; 치명타·대상 damageTakenMultiplier는 개별 타격별 기존 경로를 거친다.
- **Execution Flow / Logic**:
  1. 훨윈드: 기본 전방 검 공격의 대상 선택·VFX를 실행하지 않는다. 기본 회전 간격 `500 / (1 + attack-speed)` ms. 매 회전 시 캐릭터 중심 `125 + sword-range` 반경 안의 각 적/공격 가능한 마법진에 최대 1회 적중. 피해는 현재 검 피해 × `0.5 + whirlwind-damage-ratio`. 대상별 치명타와 처치 콜백을 한 번만 발생시킨다. 다른 무기 및 화상 피해는 기존 주기로 동작한다.
  2. N도류: 기본 공격 간격은 `1500 / (1 + attack-speed)` ms. 선택 직후 2회, `multi-sword-count` 강화마다 +1회, 최대 5회. 한 주기 안에 순차 참격을 재생하고 각 참격에서 기존 검과 같은 180도 범위·사거리·피해·치명타 판정을 수행한다. 참격별 동일 적 재적중 허용. 각 참격이 아직 살아 있는 대상만 공격하도록 이전 타격 뒤 재조회한다. 프레임 폭주를 피하도록 참격 순서를 짧은 고정 간격(예: 90ms)으로 예약하되, 주기 종료 전까지 마무리한다. 일시정지 중 예약 참격은 진행하지 않는다.
  3. 검기: 기존 근접 검 1회 공격·피해·VFX는 유지한다. 같은 공격 주기와 마우스 방향에 초승달 투사체 1개를 더한다. 화면 경계까지 직진하고 적/마법진과의 원형 또는 세그먼트 충돌을 검사한다. 최초 피해는 현재 검 피해의 100%, 이후 80%, 60%, 40%, 20%로 최초 피해 기준 20%p씩 감소; 크기도 최초 크기 기준 같은 비율. `1 + sword-wave-penetration`개(최대 5) 서로 다른 대상에 적중한 뒤 제거한다. 한 투사체가 같은 적에 중복 타격하지 않는다. 화면 밖에서는 제거. 원정 중 임시저장 시 진행 중 검기 투사체를 복원하지 않는 기존 `projectiles: []` 관례를 따른다.
  4. 공통 오류: 죽은 적은 재타격하지 않고, 0 이하 간격/비율은 방어적으로 clamp한다. 동일 공격으로 보스 HP 0이 된 뒤 추가 참격/투사체가 사망 연출을 중복 시작하지 않게 한다.

### I02. 전투 시각 효과와 정리
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `showSwordSlash`, `update`, `onEnemyDefeated`, `create` — 회전·연속 참격·검기 이펙트와 게임 일시정지/씬 종료 시 정리; modify
  - `apps/web/src/game/entities/Enemy.ts` :: `applyWeaponHit`, `worldPosition` — 실체 적중 경로 확인; read-only

#### Details
- **Signatures & Types**: `onFire`/`onProjectileUpdate` 콜백에 기존 무기와 구별되는 진화 공격 이벤트를 타입으로 표현한다. Phaser `Graphics`/`GameObjects` 참조는 씬의 배열·맵에 보관하고 명중·화면 밖·씬 종료에서 `destroy()`한다.
- **Data & Schema Fields**: 진화 공격의 화면 객체와 쿨다운은 런타임 전용. 트리 선택 및 강화 단계만 저장되며 시작 후 잔여 공격 타이머는 초기화 가능.
- **Execution Flow / Logic**: 훨윈드는 캐릭터 주위를 도는 검 궤적, N도류는 시간차 참격 여러 개, 검기는 크기 감소가 보이는 초승달 투사체. 시각 효과의 프레임과 실제 피해 판정이 같은 주기를 사용한다. 4:3 화면·75% 카메라 축소에서도 판독 가능하고, 몬스터·마차·HUD보다 적절한 depth에 둔다. 게임 종료·씬 재생성 후 이펙트 누수 없음.

### I03. 선봉장 능력치·열기 장판
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `update`, `applyUpgrade`, 적 피격 처리, `create` — 체력·재생·반사·열기 적용; modify
  - `apps/web/src/game/systems/MetaProgression.ts` :: `applyPermanentUpgrade` — 상점 최대 체력/체력 재생 값 확인; read-only
  - `apps/web/src/game/content/upgrades.ts` :: `warrior-max-health`, `warrior-regeneration`, `warrior-reflect` — 원정 강화값 확인; read-only
  - `apps/web/src/game/test/WarriorEvolutionCombat.test.ts` :: 선봉장 배율·열기 누적·상한 검증; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export function getVanguardMaxHp(baseHp: number, currentMaxHp: number): number;
  export function getVanguardHeatDamage(rank: number): number;
  // getVanguardMaxHp(100, currentMaxHp) = 100 + 2 * (currentMaxHp - 100)
  // getVanguardHeatDamage(rank) = 2 + 2 * clamp(rank, 0, 5)
  ```
- **Data & Schema Fields**: 기본 전사 HP 100은 배가하지 않는다. 현재 최대 HP에 이미 포함된 상점·원정 추가분을 선택 즉시 추가로 더하고 현재 HP도 같은 절대량만큼 올린다. 선택 후 `warrior-max-health`는 값의 2배를 최대/현재 HP에 더한다. 저장 복원 때 재계산으로 또 더하지 않는다. 재생은 현재 합산된 `health-regeneration`을 런타임에서 2배 적용한다. 반사는 상점 훈련의 `min(rank * .05, .25) * incomingDamage`와 원정 `warrior-reflect`의 고정 추가 피해를 합친 뒤 2배로 한다.
- **Execution Flow / Logic**: 플레이어 중심 150 월드픽셀 안의 살아 있는 적·공격 가능한 마법진에 500ms마다 `2 + 2 * vanguard-heat` 피해를 한 번씩 준다. 처치/보스 피해/데미지 숫자는 기존 `resolveHit`·`onEnemyDefeated`·`resolveBossDamage` 경로를 통한다. 장판은 반투명한 짙은 붉은색 원으로 표시하며 캐릭터 중심을 따라가고 depth가 적을 가리지 않게 한다. 선택 전·다른 캐릭터에는 장판과 배율을 적용하지 않는다. 체력 증가가 0이면 기본 HP는 그대로 100이다.

## Acceptance Criteria
- [ ] 훨윈드는 초당 2회 회전과 전용 강화 50→100% 피해가 실제 판정에 반영된다.
- [ ] N도류는 2→5개 개별 참격, 검기는 기본 베기에 화면 끝까지 진행하는 최대 5회 적중 투사체를 추가한다.
- [ ] 선봉장의 HP 증가분·재생·반사 2배 및 150 반경 열기 2→12 피해가 적용된다.
- [ ] 다른 트리의 능력과 강화는 선택한 트리에 섞이지 않는다.
- [ ] 보스 사망 연출·임시저장·재개·개발자 테스트와 충돌하지 않는다.

## Validation
- `npm run test --workspace @caravan/web -- WarriorEvolutionCombat.test.ts WarriorEvolution.test.ts` — 수치·중복 타격·상한·열기 처리 검증
- `npm run typecheck` — 게임/계약 타입 검사
- `npm run build --workspace @caravan/web` — 렌더링 코드 빌드

## Commit Message
```text
feat(game): implement warrior evolution combat branches

Plan: 2026-11-17-caravan-warrior-five-minute-evolution
Phase: P01-warrior-evolution
Task: T03-evolution-combat

- Add four distinct warrior combat evolutions and visual effects
- Apply tree-specific damage, health, regeneration, and range scaling
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
