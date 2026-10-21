# Task: T02 적·전투·호위 생존 규칙

## Status: done

## Goal
일반 적과 마차 우선 돌격 적이 플레이어/마차를 위협하고 자동 공격으로 처치할 수 있는 핵심 전투 루프를 구현한다.

## Decision Summary
- 기본 적은 플레이어와 마차 중 가까운 대상을 고른다. 돌격형 적은 낮은 체력과 높은 마차 우선도로 마차에 달려든다.
- 마차 HP 0은 패배, 플레이어 HP 0은 짧은 부활 대기와 무적 후 재개다.

## Implementation

### I01. 적 AI, 공격, 피해와 자동 무기
- Related Files:
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy` — target/health; new
  - `apps/web/src/game/content/enemies.ts` :: `EnemyDefinition`, `enemyCatalog` — enemy stats; new
  - `apps/web/src/game/systems/EnemyDirector.ts` :: `EnemyDirector.update` — target seeking; new
  - `apps/web/src/game/systems/CombatSystem.ts` :: `CombatSystem.resolve` — overlaps/damage; new
  - `apps/web/src/game/systems/AutoAttackSystem.ts` :: `AutoAttackSystem.update` — nearest target and cooldown; new
  - `apps/web/src/game/scenes/CaravanScene.ts` :: system update order; modify
  - `apps/web/src/game/test/CombatSystem.test.ts` :: AI/combat cases; new
- **Signatures & Types**:
  ```typescript
  export type EnemyTarget = 'hero' | 'caravan';
  export interface EnemyDefinition { id:string; maxHp:number; speed:number; damage:number; attackRange:number;
    targetPolicy:'nearest'|'caravan-priority'; wagonPriority:boolean; experience:number; gold:number; }
  export function chooseTarget(enemy:Vector2, hero:Vector2, wagon:Vector2, policy:EnemyDefinition['targetPolicy']):EnemyTarget;
  export function resolveHit(target:Damageable, amount:number, sourceId:string):DamageResult;
  ```
- **Data & Schema Fields**: `Enemy` state has `enemyId`, `hp`, `position`, `attackCooldownMs`, `target`, `dead`; initial wagon-rusher HP is `0.35 *` basic enemy HP. Basic target policy chooses Euclidean nearest target; caravan-priority always selects wagon. Hero’s initial weapon is sword auto attack nearest living enemy in range.
- **Execution Flow / Logic**: director spawns definitions from `enemyCatalog`; AI retargets each 250ms; in-range enemy applies cooldown damage; auto attack selects nearest enemy and emits hit; death removes enemy and emits XP/gold pickup event. Dead entities cannot receive more hits.
- **Error & Exception Handling**: clamp HP to `[0,maxHp]`; ignore negative/non-finite damage and duplicate death callbacks; paused scene does not advance AI, cooldown, projectile, or spawn systems.

### I02. 마차 피해, 플레이어 사망·부활, 패배 상태
- Related Files:
  - `apps/web/src/game/systems/HealthSystem.ts` :: `HealthSystem` — HP transitions; new
  - `apps/web/src/game/systems/RespawnSystem.ts` :: `RespawnSystem` — hero revive; new
  - `apps/web/src/game/state/RunState.ts` :: `RunState` — wagon/player run state; modify
  - `apps/web/src/game/test/SurvivalRules.test.ts` :: loss/respawn tests; new
- **Data & Schema Fields**: `PlayerState` includes `hp`, `maxHp`, `isDead`, `respawnMs`, `invulnerableMs`; `CaravanState` includes `hp`, `maxHp`; run transitions `active -> lost` only when wagon HP reaches zero.
- **Execution Flow / Logic**: hero HP zero hides/disables collision, starts `respawnDelayMs=3000`; timeout places hero at wagon offset `(0,80)`, restores `maxHp`, sets `invulnerableMs=2000`; wagon HP zero sets `RunStatus='lost'` and stops simulation.
- **Error & Exception Handling**: repeated death timers are idempotent; game-over overlay is emitted once; timer callbacks are cancelled when scene shuts down.

## Acceptance Criteria
- [x] Basic enemies select nearest target and attack in range
- [x] Caravan-priority enemy is low-health and attacks wagon first
- [x] Hero respawns with temporary invulnerability; wagon destruction ends run

## Validation
- `npm run test --workspace apps/web -- src/game/test/CombatSystem.test.ts src/game/test/SurvivalRules.test.ts` — targeting, damage, and state transitions pass
- `npm run typecheck` — game core typechecks

## Commit Message
```text
feat(game): add enemy combat and caravan survival rules

Plan: 2026-10-21-caravan-escort-game
Phase: P02-gameplay-core
Task: T02-combat-and-survival

- Add enemy targeting and automatic sword attacks
- Add wagon defeat, hero respawn, and invulnerability rules
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
