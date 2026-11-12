# Task: T02 Revive Shop Upgrade

## Status: done

## Goal
Let players permanently buy up to three per-run revive charges with a dedicated shop upgrade while preserving the ten existing common upgrades in their five-column, two-row grid.

## Decision Summary
- Meta upgrade ID: `extra-lives`; max level 3; each rank grants one revive charge on a fresh run.
- Rank prices: 100 G, 125 G, 150 G, matching the existing first three common-upgrade prices.
- Render this item in a separate “비상 부활” shop section, not in the 10-item common grid.

## Implementation

### I01. Contract and catalog

- Related Files:
  - `packages/contracts/src/profile.ts` :: `MetaUpgradeIdSchema`, `MetaUpgradeId` — add `extra-lives`; modify.
  - `packages/contracts/src/metaProgression.ts` :: `CommonUpgradeDefinition`, `commonUpgradeCatalog` — support rank count 3 and add the extra-lives definition; modify.
  - `apps/web/src/game/systems/MetaProgression.ts` :: `applyPermanentUpgrade` — ensure `extra-lives` rank maps to the fresh-run `player.respawnsRemaining`; modify if T01 did not already add the case.

#### Details
- **Fields and values**:
  - `extra-lives`: `{ id: 'extra-lives', maxLevel: 3, valuePerLevel: 1, rankCosts: [100, 125, 150] }`.
  - Change `CommonUpgradeDefinition.maxLevel` from literal `5` to `number`; allow rankCosts to be a readonly number array so the three-rank item type-checks. Preserve the existing five-level definitions and costs.
- **Execution Flow / Logic**:
  1. `purchaseMetaUpgrade` continues to use catalog `maxLevel` and `getUpgradeCost`; reject purchases above level 3 through the existing cap check.
  2. Applying a fresh profile to a new run converts rank to charges; never give more than three.
  3. This item changes only `respawnsRemaining`; it does not increase HP or alter in-run healing.

### I02. Shop display and layout

- Related Files:
  - `apps/web/src/features/progression/MetaShop.tsx` :: `upgradeTitles`, `upgradeEffects`, `upgradeIcons`, common upgrade grid and new revive section — label and render the upgrade; modify.
  - `apps/web/src/features/home/HomePage.css` :: `.meta-shop .upgrade-grid`, `.meta-shop .upgrade-card`, `.subsection-title` — style a single revive card without changing the five-column common grid; modify.

#### Details
- **Display strings**:
  - Title: `비상 부활`
  - Effect: `원정 중 부활 횟수 +1 (최대 3회)`
  - Rank pill: `현재 단계 / 3`
  - Button follows existing localized states: next rank price and “강화”, insufficient gold, or max level.
- **Execution Flow / Logic**:
  1. Filter `extra-lives` out of the existing `Object.values(metaUpgradeCatalog)` 5×2 grid.
  2. Render its card once below the common grid under a “비상 부활” subsection, using the existing purchase callback and `getUpgradeCost`.
  3. At narrow width, the new single card uses available width without horizontal overflow.

## Acceptance Criteria
- [x] Extra-lives has exactly three persistent purchase ranks priced 100/125/150 G.
- [x] Each rank grants one additional revive charge to a fresh run; existing saves/profile records without the key remain valid at rank zero.
- [x] The revive upgrade is visible with correct Korean title, effect, costs, rank, and cap/insufficient-gold states.
- [x] The original ten common upgrades remain exactly five columns by two rows.

## Validation
- `npm run typecheck --workspace @caravan/contracts`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`
- Do not execute the test suite.

## Commit Message
```text
feat(shop): add three-rank extra lives upgrade

Plan: 2026-10-30-caravan-survival-and-gameplay-adjustments
Phase: P01-survival-collision-and-hud
Task: T02-revive-shop

- Add permanent revive ranks at 100, 125, and 150 G
- Keep the existing common-upgrade grid at five columns and two rows
```

## Progress
- [x] Implementation complete
- [x] Validation passed (contracts/web typecheck and build)
- commit: skipped due to pre-existing overlapping worktree changes; no files staged
