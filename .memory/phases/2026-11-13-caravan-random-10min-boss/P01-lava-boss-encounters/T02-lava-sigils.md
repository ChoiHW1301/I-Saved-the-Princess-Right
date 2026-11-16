# Task: T02 Attackable Lava Sigils

## Status: done

## Goal
라바 매지션의 마법진을 모든 실제 무기 타격으로 파괴할 수 있고, 3초 경고 뒤 플레이어·마차에 폭발 피해를 적용하며 임시 저장에서 남은 마법진을 복원한다.

## Decision Summary
- 마법진 HP는 실제 타격 3회이며 한 번의 발사에서 발생한 다중 투사체는 각 투사체마다 1회로 센다.
- 3초 뒤 반경 100 월드픽셀 안에 피해 25를 준다. 마법사 처치 뒤에도 생존한 마법진은 남아 폭발한다.

## Implementation

### I01. 공격 가능 대상 인터페이스와 마법진 엔티티

- Related Files:
  - `apps/web/src/game/systems/CombatSystem.ts` :: `Damageable`, `DamageResult`, `resolveHit` — 피해 배율 및 공격 대상 타입 확장; modify
  - `apps/web/src/game/entities/Enemy.ts` :: `Enemy` — 월드 좌표·반경 및 무기 타격 어댑터; modify
  - `apps/web/src/game/entities/LavaSigil.ts` :: `LavaSigil`, `LavaSigilState` — 비충돌·3타 파괴 가능한 월드 엔티티; new
  - `apps/web/src/game/systems/WeaponSystem.ts` :: `WeaponSystem.update`, `advanceArrows`, `findTargetsOnAim` — 적과 마법진을 같은 조준·타격 기하에 넣기; modify
  - `apps/web/src/game/test/CombatSystem.test.ts` — 3타와 피해 배율 검증; modify
  - `apps/web/src/game/test/LavaSigil.test.ts` — 수명 및 타격별 파괴 검증; new

#### Details
- **Signatures & Types**:
  ```typescript
  export interface Damageable {
    id: string;
    hp: number;
    maxHp: number;
    dead?: boolean;
    damageTakenMultiplier?: number;
  }

  export interface WeaponAttackTarget extends Damageable {
    worldPosition: Vector2;
    hitRadius: number;
    applyWeaponHit(amount: number, sourceId: string): DamageResult | null;
  }

  export interface ProjectileSpawn {
    weaponId: string;
    targets: WeaponAttackTarget[];
    targetPositions: Vector2[];
    damage: number;
    penetration: number;
    projectileId?: number;
    origin?: Vector2;
    directionAngle?: number;
    speed?: number;
    statusEffect?: 'burn';
  }

  export interface LavaSigilState {
    id: string;
    x: number;
    y: number;
    hp: number;
    remainingMs: number;
  }

  export class LavaSigil extends Phaser.GameObjects.Container implements WeaponAttackTarget {
    readonly maxHp = 3;
    readonly hitRadius = 22;
    hp: number;
    dead: boolean;
    remainingMs: number;
    get worldPosition(): Vector2;
    applyWeaponHit(amount: number, sourceId: string): DamageResult | null;
    advance(deltaMs: number): 'active' | 'expired' | 'destroyed';
    toState(): LavaSigilState;
  }

  export type WeaponDamageCallback = (target: WeaponAttackTarget, damage: number, sourceId: string) => void;
  export type WeaponTargetDefeatedCallback = (target: WeaponAttackTarget) => void;

  export class WeaponSystem {
    update(
      run: RunState,
      origin: Vector2,
      enemies: readonly Enemy[],
      delta: number,
      random?: () => number,
      onFire?: (projectile: ProjectileSpawn) => void,
      aimPoint?: Vector2,
      onProjectileUpdate?: (projectile: ProjectileProgress) => void,
      onDamage?: WeaponDamageCallback,
      attackables?: readonly WeaponAttackTarget[],
      onTargetDefeated?: WeaponTargetDefeatedCallback,
    ): Enemy[];
  }

  // Enemy additionally exposes its existing worldPosition getter and:
  get hitRadius(): number;
  applyWeaponHit(amount: number, sourceId: string): DamageResult | null;
  ```
- **Data & Schema Fields**:
  - `WeaponAttackTarget`: `id:string`, `hp:number`, `maxHp:number`, `dead?:boolean`, `damageTakenMultiplier?:number`, `worldPosition:{x:number;y:number}`, `hitRadius:number`, `applyWeaponHit(amount, sourceId): DamageResult|null`. `Enemy` supplies this adapter and preserves current boss/flying/default collision radii.
  - `RunSnapshotV1.lavaSigils`: array of `{ id: IdSchema, x: CoordinateSchema, y: CoordinateSchema, hp: CounterSchema.max(3), remainingMs: CounterSchema.max(3000) }`, maximum 20, default `[]` so old strict v1 snapshots parse.
- **Zod Schema**:
  ```typescript
  const LavaSigilSnapshotSchema = z.object({
    id: IdSchema,
    x: CoordinateSchema,
    y: CoordinateSchema,
    hp: CounterSchema.min(1).max(3),
    remainingMs: CounterSchema.min(1).max(3000),
  }).strict();
  // Add to RunSnapshotV1Schema:
  lavaSigils: z.array(LavaSigilSnapshotSchema).max(20).default([]),
  ```
- **Execution Flow / Logic**:
  1. `LavaSigil` begins with `hp=3`, `maxHp=3`, `remainingMs=3000`, `dead=false`, and no Phaser physics body/collider.
  2. `LavaSigil.applyWeaponHit(amount, sourceId)` ignores damage magnitude and calls `resolveHit(this, 1, sourceId)`, so each real impact consumes exactly one of 3 hit points. At zero HP set `dead=true`; ignore later impacts. Enemy's `applyWeaponHit` calls `resolveHit(this, amount, sourceId)` and retains ordinary damage behavior.
  3. `advance(deltaMs)` subtracts only finite positive deltas. Return `destroyed` if already dead, `expired` once timer reaches zero, otherwise `active`.
  4. `resolveHit` multiplies the incoming amount by `target.damageTakenMultiplier ?? 1`, clamps HP at zero, and reports actual `damage`; non-finite/non-positive values still return `null`.
  5. `WeaponSystem.update` accepts optional trailing `attackables` and `onTargetDefeated` parameters. Merge living enemies and attackables for target picking, impact-area checks, and arrow line collision. Every target applies its own `applyWeaponHit`; keep burn state and `setBurning` exclusively on `Enemy`. Keep return value as killed `Enemy[]`; for a non-Enemy target reaching `dead`, call `onTargetDefeated(target)` exactly once.
  6. Change `ProjectileSpawn.targets` to `WeaponAttackTarget[]`, type arrow hit tracking as `Set<WeaponAttackTarget>`, and use each target's `hitRadius` in collision checks. Each unique projectile can hit each target at most once. Each spread projectile is an individual target pass. A sword swing resolves once against each target in its front half-plane and range.

### I02. Snapshot creation and restore

- Related Files:
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema` — backward-compatible sigil snapshot field; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot` — serialize active sigils; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `createRunSnapshot`, `create` — restore entities and snapshot countdown; modify
  - `packages/contracts/test/schema.test.ts` — old snapshots default to no sigils; modify
  - `apps/web/src/features/run/SaveResume.test.ts` — round-trip current sigil state; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export interface SnapshotInput {
    // all existing fields retained
    lavaSigils?: readonly LavaSigilState[];
  }
  ```
- **Execution Flow / Logic**:
  1. `createSnapshot` copies the active sigil `id/x/y`, clamps integer HP to 1–3 for saved living sigils, and rounds `remainingMs` upward into 1–3000; omit destroyed/expired sigils.
  2. During scene creation, construct each saved sigil at `mapSnapshotWorldPoint`-mapped coordinates and restore its HP and countdown exactly from the validated snapshot.
  3. While playing, remove and destroy the entity immediately after its third hit, or when its 3-second lifetime ends.
  4. Existing snapshots missing `lavaSigils` parse as `[]`; do not change `schemaVersion` or `RunSnapshotV1` version.

### I03. Fuse completion and radius damage

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: sigil update/removal branch — advance fuse and apply one explosion; modify
  - `apps/web/src/game/systems/HealthSystem.ts` :: `damagePlayer`, `damageCaravan` — use existing defensive state and game-over handling; read-only
  - `apps/web/src/game/test/LavaSigil.test.ts` — fuse completion and AoE boundary cases; modify

#### Details
- **Signatures & Types**:
  ```typescript
  const LAVA_SIGIL_FUSE_MS = 3000;
  const LAVA_SIGIL_EXPLOSION_RADIUS = 100;
  const LAVA_SIGIL_EXPLOSION_DAMAGE = 25;
  ```
- **Execution Flow / Logic**:
  1. `CaravanScene.update` advances each sigil once per unpaused frame. `active` keeps it; `destroyed` removes without explosion; `expired` removes it and detonates once.
  2. Player damage applies when player is alive and center-to-sigil squared distance is `<= 100 ** 2`; call `HealthSystem.damagePlayer(run.player, 25, run.upgradeStats['damage-reduction'] ?? 0)`.
  3. Wagon damage applies when point-to-rectangle distance is `<= 100`: rectangle is `[WORLD_WIDTH/2-112, WORLD_WIDTH/2+112] × [ROAD_CENTER_Y-36, ROAD_CENTER_Y+36]`. Clamp the sigil-to-rectangle nearest-point distance and call `HealthSystem.damageCaravan(run.caravan, 25, run)` once.
  4. Capture old health values before calling HealthSystem and trigger the existing screen-edge damage flash and damage number only when its method returns `true`. Remove entity before applying damage to prevent re-entrant/double detonation.
  5. Explosions still resolve after the mage is defeated because sigil updates are independent of active-boss state. If the encounter scene pauses for event/level-up, Phaser scene time pauses all fuses consistently.

## Acceptance Criteria
- [x] Bow penetration counts every individual collision as a hit and stops when its existing penetration count is exhausted; a sigil counts each arrow only once.
- [x] Sword, area impact, single projectile and spread projectiles can damage a sigil if their actual impact geometry intersects it.
- [x] A sigil is removed on the third hit; otherwise it explodes exactly once after 3 seconds, damaging player and wagon independently when inside the 100-pixel range.
- [x] Save/reload preserves each sigil position, remaining lifetime, and remaining hits; old saves without the field remain valid.

## Validation
- `npm run test --workspace @caravan/contracts -- test/schema.test.ts` — old and new v1 snapshot shapes parse correctly.
- `npm run test --workspace @caravan/web -- src/game/test/CombatSystem.test.ts src/game/test/LavaSigil.test.ts` — damageable, per-impact, and lifetime rules pass.
- `npm run typecheck --workspace @caravan/web` — Enemy and LavaSigil satisfy weapon target typing.

## Commit Message
```text
feat(game): add destructible lava sigils

Plan: 2026-11-13-caravan-random-10min-boss
Phase: P01-lava-boss-encounters
Task: T02-lava-sigils

- Add attackable three-hit sigils and timed area damage
- Persist active sigil health and remaining fuse across saves
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: recorded in Git history
