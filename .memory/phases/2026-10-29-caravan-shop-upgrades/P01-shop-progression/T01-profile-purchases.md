# Task: T01 Profile Purchases

## Status: done

## Goal
Persist purchases for the ten common upgrades and character-specific training through the existing version-checked profile API, so shop purchases deduct the correct gold and are preserved across sign-in and reloads.

## Decision Summary
- Common upgrade costs are exactly `[100, 125, 150, 175, 200]`; training ability unlocks cost 500 G and five-rank training uses that same ladder.
- Preserve `passiveIds` for backward compatibility, but do not expose old passive purchases. New training data defaults to an empty map.

## Implementation

### I01. Shared IDs and profile schema
- Related Files:
  - `packages/contracts/src/profile.ts` :: `MetaUpgradeIdSchema`, `PlayerProfileSchema` — profile purchase IDs and stored levels; modify.
  - `packages/contracts/src/metaProgression.ts` :: common/training purchase catalogs — one authoritative source for costs and rank metadata; new.
  - `packages/contracts/src/index.ts` :: public exports — export new IDs; modify.
  - `apps/api/src/data/profileRepository.ts` :: initial profile document — initialize `characterTrainingLevels`; modify.

#### Details
- **Types**:
  ```typescript
  type MetaUpgradeId = 'max-health' | 'attack-damage' | 'critical-chance' | 'move-speed' | 'attack-speed' | 'health-regeneration' | 'wagon-max-health' | 'xp-gain' | 'gold-gain' | 'defense';
  type TrainingId = 'warrior-thorn-armor' | 'archer-dash' | 'mage-wind-spirit' | 'merchant-money-bomb';
  type CharacterTrainingLevels = Partial<Record<CharacterId, Partial<Record<TrainingId, number>>>>;
  ```
- Add `TrainingIdSchema` with the four IDs above and export its inferred type.
- Extend `MetaUpgradeIdSchema` with all ten IDs above. Keep `permanentUpgradeLevels` as `Record<string, Counter>` to read existing keys.
- Add `characterTrainingLevels: z.partialRecord(CharacterIdSchema, z.partialRecord(TrainingIdSchema, CounterSchema)).default({})` to `PlayerProfileSchema`; partial records allow an empty map and only purchased character/training entries.
- Keep `passiveIds` required/readable as currently defined. Existing documents lacking `characterTrainingLevels` parse as `{}`; do not rewrite or migrate their other fields.
- Add `characterTrainingLevels: {}` to newly created profile documents and typed profile literals so the inferred `PlayerProfile` output type stays valid.
- Export `COMMON_UPGRADE_RANK_COSTS = [100, 125, 150, 175, 200] as const`; export `commonUpgradeCatalog` keyed by the ten common IDs with `maxLevel: 5`, `valuePerLevel`, and that rank-cost tuple. Export `characterTrainingCatalog` keyed by the four training IDs with `characterId`, `kind: 'ranked' | 'unlock'`, `maxLevel`, and `rankCosts`; unlock entries use `maxLevel: 1` and `[500]`, ranked entries use the common rank-cost tuple. This contracts module is the authoritative cost source for web and API.

### I02. Authoritative purchase rules and API
- Related Files:
  - `apps/api/src/services/profileService.ts` :: `upgradeCatalog`, `purchaseUpgrade`, new `purchaseTraining` — validate costs and update the profile; modify.
  - `apps/api/src/functions/profile.ts` :: request schemas and HTTP routes — expose the training purchase; modify.
  - `apps/web/src/features/profile/profileApi.ts` :: `purchaseTraining` — call the endpoint and parse the result; modify.
  - `apps/web/src/features/profile/useProfile.ts` :: purchase callbacks — expose training purchase to pages; modify.
  - `apps/web/src/features/home/HomePage.tsx` :: shop callbacks — connect the new callback; modify.
  - `apps/web/src/features/progression/MetaShop.tsx` :: `MetaShop` — remove obsolete passive purchase cards and accept the training callback for T02; modify.
  - `apps/web/vite.localPlaytest.ts` :: local profile endpoints — mirror validation, debit, and version update; modify.
  - `apps/web/src/game/content/metaProgression.ts` :: catalog exports — re-export shared contracts catalog and cost helper; modify.
  - `apps/web/src/game/systems/MetaProgression.ts` :: `getUpgradeCost`, `purchaseMetaUpgrade`, legacy `purchasePassive` — use fixed-rank costs and reject deprecated passive purchase; modify.
  - Existing test fixtures/assertions in `apps/api/test/services/runService.test.ts`, `apps/api/test/data/repositories.test.ts`, `apps/api/test/functions/profile-save.test.ts`, `apps/web/src/features/home/HomePage.test.tsx`, `apps/web/src/features/run/SaveResume.test.ts`, `apps/web/src/features/results/ResultPage.test.tsx`, and `apps/web/src/game/test/MetaProgression.test.ts` — keep profile fixtures typed and update expectations for fixed pricing/retired passives; modify existing files only, do not add tests.

#### Details
- API imports the shared contracts catalogs; do not duplicate costs in `apps/api/src/services/profileService.ts`.
- Training purchase request is strict JSON `{ characterId: CharacterId; trainingId: TrainingId; expectedProfileVersion: number }`; POST route is `profile/trainings`.
- `purchaseTraining(caller, request)` gets the caller's profile, rejects version mismatch with existing `PROFILE_CONFLICT`, rejects a character not in `unlockedCharacters`, validates that the training belongs to that character, uses 500 G for Archer/Mage unlocks (levels 0→1 only) and the rank ladder for Warrior/Merchant (levels 0→5), rejects maxed/repeated purchase with `400 INVALID_UPGRADE`, rejects insufficient balance with `409 INSUFFICIENT_GOLD`, and saves one version increment plus gold deduction and new level.
- Update existing `profile/upgrades` to accept only the ten common IDs and use the exact fixed rank ladder. Retire the old passive purchase route/callback so the three obsolete passives cannot be purchased; retain the stored `passiveIds` field without applying it.
- Remove the three obsolete passive cards in `MetaShop` in this task so the UI never presents a dead purchase action. T02 adds the new per-character training cards.
- Web API sends the profile version and parses the response with `PlayerProfileSchema`; local playtest behavior must match the Functions API.

## Acceptance Criteria
- [ ] Existing profile documents without `characterTrainingLevels` still load and old `passiveIds` remain intact.
- [ ] Common and training purchases enforce exact prices, rank limits, unlock ownership, gold balance, and expected profile version in API and local playtest mode.
- [ ] The web client exposes typed purchase calls for common upgrades and training.

## Validation
- `npm run build --workspace @caravan/contracts` — contract package builds.
- `npm run typecheck --workspace @caravan/api` — API types pass.
- `npm run typecheck --workspace @caravan/web` — web types pass.

## Commit Message
```text
feat(profile): persist common upgrades and character training

Plan: 2026-10-29-caravan-shop-upgrades
Phase: P01-shop-progression
Task: T01-profile-purchases

- Extend profile contracts and version-checked purchase handlers
- Preserve old profile fields while defaulting new training data
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: pending
