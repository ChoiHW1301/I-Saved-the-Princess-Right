# Task: T03 Common Upgrade Effects

## Status: pending

## Goal
Apply the profile's common upgrade ranks to each new run so shop purchases affect combat, movement, survivability, wagon durability, XP, and gold.

## Decision Summary
- All common upgrades are shared across unlocked characters; effects are additive by rank unless the effect itself is a damage-reduction calculation.
- Critical chance is 2 percentage points per rank and critical damage is 2×. Player defense does not reduce wagon damage.

## Implementation

### I01. Catalog and run stat initialization
- Related Files:
  - `apps/web/src/game/content/metaProgression.ts` :: `metaUpgradeCatalog`, `getUpgradeCost` inputs — replace old four-item catalog; modify.
  - `packages/contracts/src/metaProgression.ts` :: `commonUpgradeCatalog` — authoritative values and fixed cost tuple; read-only.
  - `apps/web/src/game/systems/MetaProgression.ts` :: `applyPermanentUpgrade`, `purchaseMetaUpgrade` — initialize stats and use fixed costs; modify.
  - `apps/web/src/game/content/characters.ts` :: `characterCatalog` — Merchant base max HP; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create` — apply profile ranks on a new run; modify.

#### Details
- Consume the shared catalog for the ten values: `attack-damage .05`, `critical-chance .02`, `move-speed 6`, `attack-speed .10`, `max-health 10`, `health-regeneration .2`, `wagon-max-health 20`, `xp-gain .05`, `gold-gain .05`, `defense .02`. Do not redefine price/effect constants in web gameplay.
- `getUpgradeCost` returns `[100,125,150,175,200][currentLevel]`; reject noninteger, negative, or capped levels as the existing service does.
- Add and export `rollCriticalDamage(baseDamage: number, criticalChance: number, random: () => number): { damage: number; critical: boolean }` in `apps/web/src/game/systems/CombatSystem.ts`. Clamp chance to `[0,1]`, roll once, return `baseDamage * 2` on a critical result and unchanged damage otherwise. Use the seeded run RNG. Reuse this function for direct hits and Money Bomb; do not call it for damage-over-time ticks.
- `applyPermanentUpgrade(profile, run)` adds max-health rank×10 to player current and max HP; wagon rank×20 to current and max HP; move-speed rank×6 to `upgradeStats['movement-speed']`; damage rank×.05 to `global-damage-multiplier`; attack speed rank×.10 to `attack-speed`; crit rank×.02 to `critical-chance`; regen rank×.2 to `health-regeneration`; XP and gold rank×.05 to `xp-gain` / `gold-gain`; defense rank×.02 to `damage-reduction`.
- Set Merchant `baseStats.maxHp` to 95; Warrior 100, Archer 90, Mage 82 remain unchanged.
- Keep this application limited to a new run; a resumed run uses its snapshot stats and must not apply the profile upgrades twice.

### I02. Combat, reward, and HUD integration
- Related Files:
  - `apps/web/src/game/systems/WeaponSystem.ts` :: `update`, damage calculation — use attack-speed, damage, and crit stats; modify.
  - `apps/web/src/game/systems/CombatSystem.ts` :: `rollCriticalDamage` — shared seeded critical-hit rule; modify.
  - `apps/web/src/game/systems/HealthSystem.ts` :: `damagePlayer` — apply player damage reduction; modify.
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `update`, `onEnemyDefeated`, `collectReward` — apply movement, regeneration, XP, and gold; modify.

#### Details
- Apply `attack-speed` to every equipped weapon interval as `weapon.intervalMs / (1 + bonus)`.
- For each direct weapon hit, call `rollCriticalDamage` with the run's critical chance. Do not crit burn ticks. T05 calls this same helper for each enemy hit by Money Bomb.
- `HealthSystem.damagePlayer` computes `effectiveDamage = amount * (1 - damageReduction)`; keep `damageCaravan` unchanged. The configured maximum reduction is 10%.
- Add rank-scaled movement to selected character's base speed. Keep health regeneration clamped to max HP.
- Multiply each earned XP/gold award and each pickup amount, including Merchant bomb coins, by `(1 + correspondingBonus)` and round with `Math.round` once per award. XP passed to `LevelSystem.addXp` must remain a positive integer. The bomb coin's base value is determined from damage dealt before the gold bonus.
- Save `upgradeStats` in existing run snapshots as currently done; do not reapply profile bonuses during resume.

## Acceptance Criteria
- [ ] Each of ten profile levels produces the exact confirmed rank effect and purchases use fixed prices.
- [ ] Critical chance, 2× critical damage, defense, regeneration, speed, attack speed, and reward bonuses behave consistently for every character.
- [ ] Wagon damage is unchanged by player defense; new-run stat initialization does not double-apply on resume.

## Validation
- `npm run typecheck --workspace @caravan/web` — gameplay types pass.
- `npm run build --workspace @caravan/web` — game bundle builds.
- Manual: begin one run per unlocked character with representative rank profiles; inspect max HP, speed, attack rate, hit/crit, player damage, wagon damage, regeneration, XP and gold awards.

## Commit Message
```text
feat(gameplay): apply shared shop upgrade effects

Plan: 2026-10-29-caravan-shop-upgrades
Phase: P01-shop-progression
Task: T03-common-upgrade-effects

- Apply ten permanent stats when starting a new run
- Integrate critical hits, defense, and reward bonuses
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
