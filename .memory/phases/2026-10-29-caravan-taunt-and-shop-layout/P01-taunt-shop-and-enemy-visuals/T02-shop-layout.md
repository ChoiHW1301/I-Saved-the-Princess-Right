# Task: T02 Shop Layout and Multiple Trainings

## Status: done

## Goal
Show every training for the selected unlocked character and keep the ten common-upgrade cards in exactly five columns and two rows at every viewport width. Scale cards and contents into available width without horizontal scrolling, and align ranked and unlock training cards by reserving the rank-bar height on unlock cards.

## Decision Summary
- Common upgrades remain a five-column grid at all widths; small viewports shrink cards instead of switching to one column or adding horizontal scrolling.
- Training entries are derived from `characterTrainingCatalog` by selected `characterId`, supporting future entries without per-character hard-coded branches.
- Unlock cards reserve the same vertical space as `.level-track` including its margins.
- Character portraits and purchase rules/costs stay unchanged.

## Implementation

### I01. Render all catalog trainings for the selected character
- Related Files:
  - `apps/web/src/features/progression/MetaShop.tsx` :: `trainingByCharacter`, `trainingNames`, `trainingEffects`, `MetaShop`, `purchaseTraining`; modify.
  - `packages/contracts/src/metaProgression.ts` :: `characterTrainingCatalog`; read-only source.

#### Details
- Remove `trainingByCharacter: Partial<Record<CharacterId, TrainingId>>`; derive the selected training list by filtering `Object.values(characterTrainingCatalog)` where `definition.characterId === selectedCharacter`.
- Preserve current entry order: Warrior Thorn Armor then Taunt; Archer Dash; Mage Wind Spirit; Merchant Money Bomb. Additional entries follow catalog insertion order.
- Add Taunt label/effect to `Record<TrainingId, string>` maps if not already present after T01. Preserve existing Korean labels and effect text.
- Render one `.training-card` per definition with `key={training.id}`. Independently derive `level = profile.characterTrainingLevels[selectedCharacter]?.[training.id] ?? 0`, `capped = level >= training.maxLevel`, `cost = capped ? undefined : training.rankCosts[level]`, and `owned = training.kind === 'unlock' && level > 0`.
- Keep `purchaseTraining(trainingId)` calling `onBuyTraining(selectedCharacter, trainingId)` and update only when it returns a profile. Disable each button when busy, capped, or short on gold. Keep the 500 G unlock cost and existing ranked cost schedule.
- Preserve portrait, heading, level pill, and status text. Ranked cards render their progress bar; unlock cards render an empty spacer with the same dimensions and margins.

### I02. Keep the common-upgrade grid at five columns responsively
- Related Files:
  - `apps/web/src/features/home/HomePage.css` :: `.upgrade-grid`, `.upgrade-card`, `.upgrade-top`, `.upgrade-title-group`, `.meta-icon`, `.level-pill`, `.level-track`, `.training-card`, and responsive media rules; modify.
  - `apps/web/src/features/progression/MetaShop.tsx` :: `.upgrade-grid`/`.upgrade-card` markup; read-only unless an additional class hook is required.

#### Details
- Make the final `.meta-shop .upgrade-grid` rule use `grid-template-columns: repeat(5, minmax(0, 1fr))` at every viewport width. Override the current `@media (max-width: 600px)` one-column rule. Use a responsive gap, no horizontal scrolling, and no fewer columns.
- Set `min-width: 0` on grid items and nested flex/grid text containers. Allow Korean copy and buttons to wrap; scale padding, gaps, font sizes, and icon boxes with `clamp()` or breakpoints. Let cards grow vertically rather than clip content or force a minimum width.
- Preserve the existing `meta-icon` sprite-sheet aspect while scaling its box uniformly. Use `object-fit: contain` for portraits; do not stretch image assets.
- Keep level pills and purchase controls visible at the narrowest supported app width. All ten items remain in two rows.
- Make the unlock spacer match `.meta-shop .level-track` height (`5px`) and its vertical spacing exactly; render only for `kind === 'unlock'`.
- Do not change `.passive-grid` or unrelated home/game shell responsiveness.

## Acceptance Criteria
- [x] Every training assigned to the selected unlocked character appears, including both Warrior trainings.
- [x] Additional catalog entries need no new character-to-single-training mapping.
- [x] Common upgrades always display as exactly five columns and two rows, including below the existing 600 px breakpoint.
- [x] The common grid adds no horizontal scrollbar; copy and controls remain visible through wrapping/scaling.
- [x] Unlock cards reserve the rank-bar space and align their controls with ranked cards.
- [x] Existing purchase labels, balances, prices, cap behavior, portraits, and merchant interaction remain intact.

## Validation
- `npm run typecheck --workspace @caravan/web` — validate React/catalog-derived card types.
- `npm run build --workspace @caravan/web` — verify production CSS/JS build.
- Automated validation passed. Manual responsive check at desktop and narrow mobile widths was unavailable because this environment exposed no browser tab; inspect five columns, horizontal overflow, card wrapping, and ranked/unlock alignment during the next local play session.

## Commit Message
```text
feat(shop): show multiple trainings in compact grid

Plan: 2026-10-29-caravan-taunt-and-shop-layout
Phase: P01-taunt-shop-and-enemy-visuals
Task: T02-shop-layout

- Render every catalog training for the selected character
- Keep common upgrades in a responsive five-column grid
```

## Progress
- [x] Implementation complete
- [x] Automated validation passed
- commit: pending
