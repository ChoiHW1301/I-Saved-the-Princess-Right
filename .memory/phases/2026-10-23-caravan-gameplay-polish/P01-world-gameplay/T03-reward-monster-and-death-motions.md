# Task: T03 Reward Monster, Pickups, Difficulty, and Death Motions

## Status: done

## Goal

Start gradual regular-monster HP growth at 2:30, add a rare monster that drops one collectible reward, preserve active pickups through save/resume, and replace all regular monster dissolve effects with type-specific in-place pixel death animations.

## Decision Summary

- The reward monster occupies 5% of all spawn rolls; the other 95% preserves the current normal-enemy proportions.
- A reward monster drops one of four equal-probability pickups. The player collects it by touching it. It expires after 30 seconds and blinks increasingly fast during its final five seconds.
- Rewards are +10 gold, 5x the current ordinary monster XP value (15 XP with the current common ghoul's 3 XP), 10% maximum player HP, or +40 current caravan HP. Healing is capped and the caravan repair does not raise max HP.
- Regular enemy HP begins ramping at 150 seconds. Preserve fragile wagon rushers as the low-HP exception.
- Death animation is unique per regular monster type and plays at the death location without scale or alpha fade.

## Implementation

### I01. Add enemy health progression and reward monster definition

- Related Files:
  - `apps/web/src/game/content/enemies.ts` :: `EnemyDefinition`, `enemyCatalog`; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `spawnEnemy`, `enemyDefinition`, `onEnemyDefeated`; modify
  - `apps/web/src/game/systems/EnemyProgression.ts` :: new `scaledEnemyHp` helper
  - `apps/web/src/game/test/EnemyCatalog.test.ts` :: catalog and spawn-weight cases; modify
  - `apps/web/src/game/test/EnemyProgression.test.ts` :: new HP curve tests
  - `apps/web/public/game-assets/monsters/fortune-wraith.png` :: new transparent idle sprite

#### Details

- Add an ordinary `EnemyDefinition` with ID `fortune-wraith`, a `rewardMonster: true` marker, player-priority targeting, visible gold/accent palette, a 64 x 64 transparent pixel sprite, and no direct gold/XP reward (the pickup owns the reward).
- In `CaravanScene.spawnEnemy()`, first roll `random() < 0.05` for `fortune-wraith`. If it misses, roll the existing normal table with its current relative proportions normalized within the remaining 95%.
- Add `scaledEnemyHp(baseHp, elapsedSeconds, wagonPriority)` in `EnemyProgression.ts`:
  - Return `baseHp` for wagon-priority rushers and for `elapsedSeconds <= 150`.
  - Otherwise use `factor = 1 + min(2.25, (elapsedSeconds - 150) / 120)` and `Math.ceil(baseHp * factor)`.
  - Apply the same progression at spawn and restore so the snapshot's saved HP is clamped against the correct max HP.
- Do not change attack damage or HP gain in character upgrade definitions.

#### Signatures & Types

```typescript
export interface EnemyDefinition {
  // existing fields
  rewardMonster?: boolean;
}

export function scaledEnemyHp(baseHp: number, elapsedSeconds: number, wagonPriority: boolean): number;
```

### I02. Implement ground pickups and backward-compatible snapshots

- Related Files:
  - `apps/web/src/game/entities/RewardPickup.ts` :: new Phaser pickup sprite and expiry/blink state
  - `apps/web/src/game/systems/RewardPickupSystem.ts` :: new spawn/collect/update rules
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `preload`, `create`, `update`, `onEnemyDefeated`, `createRunSnapshot`; modify
  - `apps/web/src/game/systems/HealthSystem.ts` :: capped player/caravan healing methods; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot`, restore pickup data; modify
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema`; modify
  - `packages/contracts/test/schema.test.ts` :: optional legacy pickup data; modify
  - `apps/web/public/game-assets/pickups/gold-pile.png` :: new reward icon
  - `apps/web/public/game-assets/pickups/experience-crystal.png` :: new reward icon
  - `apps/web/public/game-assets/pickups/heart.png` :: new reward icon
  - `apps/web/public/game-assets/pickups/repair-hammer.png` :: new reward icon
  - `apps/web/src/game/test/RewardPickupSystem.test.ts` :: new pickup rule tests
  - `apps/web/src/game/test/SaveSnapshotSystem.test.ts` :: snapshot round-trip; new if absent

#### Details

- Define `RewardType = 'gold' | 'experience' | 'player-health' | 'caravan-repair'`.
- Define each pickup as `{ id: string; type: RewardType; x: number; y: number; amount: number; remainingMs: number }`.
- At `fortune-wraith` death, choose exactly one of four reward types using four equal 25% intervals from the run's seeded RNG. Calculate amount immediately and store it on the pickup:
  - Gold: 10.
  - Experience: `5 * ordinaryMonsterExperienceAt(run.elapsedSeconds)`. With the current standard ghoul XP=3, award 15.
  - Player health: `ceil(run.player.maxHp * 0.10)`.
  - Caravan repair: 40.
- Spawn the corresponding pixel-art icon at the monster's death position. Track a 30,000 ms remaining lifetime using scene delta; while remaining time is <= 5,000 ms, toggle visibility with intervals that shrink from 300 ms to 75 ms. Remove the pickup when its timer reaches zero.
- Collect on player overlap using center-to-center distance <= 30 world pixels; collection is once-only. Add gold to `run.runGold`, pass experience to `LevelSystem.addXp`, clamp player healing to `maxHp`, and clamp caravan repair to caravan `maxHp` without changing it.
- Add `rewardPickups` to `RunSnapshotV1Schema` as an array with max length 100 and default `[]` for older V1 saves. Each entry validates `id`, enum `type`, world `x/y`, nonnegative `amount`, and `remainingMs` in 0..30,000. Serialize and restore all active drops and their timers.
- Keep old enemy kill rewards and all existing boss rewards unchanged.

#### Execution Flow / Logic

1. Only `fortune-wraith` death chooses and creates a reward pickup.
2. Pickup effect is granted only after player overlap, never at monster death.
3. Use the saved seeded RNG for reward choice so a run remains reproducible.
4. Update pickup timers only when the Phaser scene is running; paused menus do not consume the 30-second lifetime.
5. Save/resume recreates the same pickup types, positions, amounts, and remaining lifetimes.

### I03. Replace generic monster dissolve with type-specific death sprites

- Related Files:
  - `apps/web/src/game/entities/Enemy.ts` :: constructor, `preload` contract, `playDeathEffect`; modify
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `preload`; modify
  - `apps/web/public/game-assets/monsters/death-keep-ghoul.png` :: new 4-frame sheet
  - `apps/web/public/game-assets/monsters/death-wagon-rusher.png` :: new 4-frame sheet
  - `apps/web/public/game-assets/monsters/death-sky-wisp.png` :: new 4-frame sheet
  - `apps/web/public/game-assets/monsters/death-fortune-wraith.png` :: new 4-frame sheet
  - `apps/web/src/game/test/EnemyCatalog.test.ts` :: death animation key mapping assertion; modify

#### Details

- Generate each death sheet as a transparent 384 x 96 PNG containing four 96 x 96 horizontal frames, nearest-neighbor pixel art matching the corresponding monster's current visible form and palette.
- Frames depict one short in-place sequence: hit recoil, body buckling, collapse, final grounded pose. Do not change frame scale, sprite alpha, or world position between frames; do not add outward fragments.
- `Enemy` maps the four regular IDs to their matching death sheet, hides/destroys the living body once, then plays a Phaser one-shot animation at the captured world position and destroys the animation object on `animationcomplete`.
- Existing miniboss and final-boss defeat presentation remains unchanged in this task.

### I04. Test mechanics and persistence

- Add deterministic tests asserting: spawn probability boundaries for 5%; normal weights retain relative ratios; HP equals base at 150 seconds, increases monotonically after 150, is greater than base warrior damage for common enemies by 300 seconds, and leaves wagon rushers low HP; each reward type can be selected at its equal interval; amounts use the agreed formulas; collection is player-contact-only and capped; expiry/blink boundaries; pickup snapshot backward compatibility and round-trip.
- Add a death animation test verifying the selected sheet key matches each regular monster ID and no tween changes alpha or scale.

## Acceptance Criteria

- [ ] The reward monster appears on 5% of spawn rolls without skewing the existing normal-enemy proportions.
- [ ] Regular enemies become more durable starting at 2:30; by the 5-minute mini-boss, an unupgraded warrior needs more than one hit for common ghouls, while rushers remain fragile.
- [ ] A reward monster drops exactly one equal-probability reward; the reward is gained only by touching its icon.
- [ ] Pickups expire after 30 seconds and blink increasingly fast during their final five seconds.
- [ ] Player and caravan healing obey their maximum values; caravan repair does not raise its maximum.
- [ ] Active drops and remaining time survive save/resume; old snapshots without drops still load.
- [ ] Each regular monster type plays its own in-place pixel death sequence without enlargement, fade, or flying fragments.

## Validation

- `npm run test --workspace @caravan/contracts -- test/schema.test.ts`
- `npm run test --workspace @caravan/web -- src/game/test/EnemyCatalog.test.ts src/game/test/EnemyProgression.test.ts src/game/test/RewardPickupSystem.test.ts src/game/test/SaveSnapshotSystem.test.ts`
- `npm run typecheck --workspace @caravan/web`
- Browser play check: compare an unupgraded warrior's basic ghoul hits before 2:30 and around 5:00; collect all four pickup outcomes; wait through expiry; save and resume with an active drop.

## Commit Message

```text
feat(game): add rare reward pickups and monster death animations

Plan: 2026-10-23-caravan-gameplay-polish
Phase: P01-world-gameplay
Task: T03-reward-monster-and-death-motions

- Ramp regular monster durability after 2:30
- Add touch pickups with expiry and type-specific death sheets
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual browser reward/animation check (preview tool could not attach)
- commit: not created because the worktree contains extensive pre-existing edits; staging these files wholesale would include unrelated work

