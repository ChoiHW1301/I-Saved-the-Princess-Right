# Task: T03 캐릭터·무기·영구 성장·해금

## Status: done

## Goal
용사와 세 해금 캐릭터의 자동 공격·개별 강화 방향을 구성하고, 골드 영구 강화와 첫 플레이/클리어/누적 골드 해금을 제공한다.

## Decision Summary
- 캐릭터: 기본 용사, 첫 판 종료 궁수, 첫 클리어 마법사, 누적 골드 히든 상인. 마왕(용사)은 후속 범위다.
- 기본 능력치 강화는 비용 증가와 최대 단계가 있고, 일부 패시브는 한 번 해금한다.

## Implementation

### I01. Character/weapon catalog and per-run upgrades
- Related Files:
  - `packages/contracts/src/characters.ts` :: `CharacterDefinition`, `WeaponDefinition`; new
  - `apps/web/src/game/content/characters.ts` :: `characterCatalog`; new
  - `apps/web/src/game/content/weapons.ts` :: `weaponCatalog`; new
  - `apps/web/src/game/content/upgrades.ts` :: character upgrade entries; modify
  - `apps/web/src/game/systems/WeaponSystem.ts` :: `WeaponSystem.update`, `addWeapon`; new
  - `apps/web/src/game/test/CharacterCatalog.test.ts` :: roster/content rules; new
- **Signatures & Types**:
  ```typescript
  export interface CharacterDefinition { id:CharacterId; name:string; unlockRule:'default'|'first-run'|'first-clear'|'gold-threshold';
    startingWeaponId:string; baseStats:{maxHp:number;speed:number;damageMultiplier:number}; beginner:boolean; }
  export interface WeaponDefinition { id:string; owner:CharacterId; intervalMs:number; damage:number; range:number;
    projectileCount:number; penetration:number; statusEffect?:'burn'; }
  export function getAvailableUpgrades(characterId:CharacterId, state:RunState):UpgradeDefinition[];
  export function fireWeapons(state:RunState, targets:Enemy[]):ProjectileSpawn[];
  ```
- **Data & Schema Fields**: `hero` starts with sword and beginner flag; upgrades `sword-damage`, `sword-range`, `sword-wave`, `hero-max-hp`, `reflect-damage`. `archer` bow upgrades `arrow-damage`, `arrow-penetration`, `arrow-range`, `burn`. `mage` fireball applies burn-over-time and offers `fireball-size`, `fireball-damage`, `fireball-impact-area`, `weak-copy`, plus run upgrades `ice-spear` and `thunder`; each spell has separate `WeaponDefinition`. `merchant` starts with 3 gold pellets and upgrades `pellet-count`, `pellet-damage`, `pellet-range`, `spread-tightness`. Add generic level cap 5 in `upgradeCatalog`; every field lives in data, not entity conditionals.
- **Execution Flow / Logic**: select character's starting weapon; each weapon has an independent cooldown; `WeaponSystem` builds projectiles/effects from catalog; eligible upgrades filter by owner and level cap; additions (`ice-spear`, `thunder`, sword wave) register additional weapon/effect state.
- **Error & Exception Handling**: unknown character or weapon ID fails catalog validation before run starts; a character cannot equip another class’s exclusive upgrades; invalid numeric catalog entries fail unit tests.

### I02. Gold meta shop, passive unlocks, and character unlock conditions
- Related Files:
  - `packages/contracts/src/profile.ts` :: `MetaUpgradeId`, `PassiveId`; modify
  - `apps/web/src/game/content/metaProgression.ts` :: `MetaUpgradeDefinition`, `PassiveDefinition`, unlock config; new
  - `apps/web/src/game/systems/MetaProgression.ts` :: `applyPermanentUpgrade`, `checkUnlocks`; new
  - `apps/api/src/config/gameRewards.ts` :: merchant threshold; modify
  - `apps/web/src/game/test/MetaProgression.test.ts` :: purchase/unlock conditions; new
- **Signatures & Types**:
  ```typescript
  export interface MetaUpgradeDefinition { id:MetaUpgradeId; maxLevel:number; baseCost:number; costGrowth:number; stat:string; valuePerLevel:number; }
  export interface PassiveDefinition { id:PassiveId; cost:number; description:string; }
  export interface RunSummary { runId:string; characterId:CharacterId; status:'won'|'lost'; finalKarma:number;
    endingId:EndingId; kills:number; elapsedSeconds:number; goldAward:number; }
  export function checkUnlocks(profile:PlayerProfile, run:RunSummary):PlayerProfile;
  export function getUpgradeCost(definition:MetaUpgradeDefinition, currentLevel:number):number;
  ```
- **Data & Schema Fields**: permanent meta stats are `maxHp`, `attackDamage`, `moveSpeed`, `wagonMaxHp`; max level 5; cost formula `baseCost * costGrowth ** currentLevel`, integer rounded up. One-time passive catalog initially contains `iron-will`, `keen-edge`, `swift-step`, each affordable once. Archer unlocks after any completed run including loss; mage unlocks after any won ending; merchant unlocks when lifetime gold reaches configurable `MERCHANT_GOLD_THRESHOLD=500` (planning initial value; keep server config so play balance can change it). Dark hero remains future-only.
- **Execution Flow / Logic**: run receipt determines first-run/clear achievements; lifetime gold is added only once; check character unlocks after award; profile carries unlocked IDs and achievement flags. Meta purchase checks balance and cap, deducts gold, increments level, persists via API.
- **Error & Exception Handling**: duplicate run receipt cannot grant another unlock/award; insufficient gold or max level rejects purchase; unknown catalog ID returns `INVALID_UPGRADE`.

## Acceptance Criteria
- [x] Four first-version characters have distinct starting weapon and upgrade pool
- [x] Mage can add ice spear and thunder while retaining fireball’s separate upgrades
- [x] Archer unlocks after first run, mage after first clear, merchant at configurable lifetime-gold threshold
- [x] Permanent upgrades are capped and one-time passives cannot be bought twice

## Validation
- `npm run test --workspace apps/web -- src/game/test/CharacterCatalog.test.ts src/game/test/MetaProgression.test.ts` — catalogs and unlock paths pass
- `npm run test --workspace apps/api -- test/services/runService.test.ts` — lifetime gold/unlock awards are idempotent
- `npm run typecheck` — game and profile contracts typecheck

## Commit Message
```text
feat(progression): add characters weapons and meta unlocks

Plan: 2026-10-21-caravan-escort-game
Phase: P03-campaign-content
Task: T03-characters-and-meta

- Add four differentiated playable character catalogs
- Add capped gold upgrades, passives, and unlock rules
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: feat(progression): add characters weapons and meta unlocks
