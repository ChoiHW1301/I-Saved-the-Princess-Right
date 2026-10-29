# Task: T02 Shop UI

## Status: pending

## Goal
Present all common upgrades and the selected unlocked character's training in the shop, with costs, rank progress, purchase states, and fitting pixel icons.

## Decision Summary
- Common upgrades have ten entries and five ranks; only the selected character's training is displayed.
- The shop retains the existing warm pixel-fantasy visual style and hides locked characters.

## Implementation

### I01. Shop selection and purchase UI
- Related Files:
  - `apps/web/src/features/progression/MetaShop.tsx` :: `MetaShop` — common upgrades, character selector, and training cards; modify.
  - `apps/web/src/features/home/HomePage.tsx` :: shop section and callbacks — pass the training purchase function; modify.

#### Details
- **Props**: `profile: PlayerProfile`; `onPurchased(profile: PlayerProfile): void`; `onBuyUpgrade(id: MetaUpgradeId): Promise<PlayerProfile | undefined>`; `onBuyTraining(characterId: CharacterId, trainingId: TrainingId): Promise<PlayerProfile | undefined>`; `busy?: boolean`; `error?: string | null`.
- Initialize selected character to the first unlocked character in the existing campaign order `warrior, archer, mage, merchant`; when profile changes, if selection is locked, select the first unlocked character. Do not render locked-character names or silhouettes.
- Render ten shared cards with current/max rank, next rank effect, next cost, insufficient-gold state, max-rank state, and a disabled button while busy. Display the five exact fixed prices by rank.
- Render only the selected character's training card. Warrior and Merchant show `rank / 5` and next-rank price. Archer and Mage show locked/owned states and a 500 G purchase button. Use Korean names: 가시 갑옷, 대쉬, 바람 정령의 가호, 머니 밤.
- Successful calls replace the profile via `onPurchased`; failed calls keep the current profile and rely on the existing inline error. Do not show unlock conditions for locked characters.
- Keep the existing merchant recruitment dialogue/button behavior; remove the three old shared passive cards and their buy handlers.

### I02. Pixel icon and responsive card styling
- Related Files:
  - `apps/web/src/features/home/HomePage.css` :: `.upgrade-grid`, `.upgrade-card`, `.passive-grid`, shop media rules — warm responsive card layout; modify.
  - `apps/web/public/game-assets/ui/icons-atlas.png` — existing 4×4 pixel icon atlas; read-only.

#### Details
- Use atlas frames with 313 px cells via CSS sprite backgrounds (atlas is 1252×1252): player health 0, wagon 1, critical chance/XP 2–3, cooldown/attack speed 4, damage 5, gold 6/12, defense 8/15. Reuse the closest existing icon for movement and regeneration; do not add bitmap assets.
- Keep icons decorative with `aria-hidden="true"`; each card title remains the accessible name. Preserve visible focus, disabled states, and mobile single-column behavior. Character selector uses existing portrait files `/game-assets/portrait-{warrior|archer|mage|merchant}.png` with `object-fit: contain` and no fixed overflowing dimensions.

## Acceptance Criteria
- [ ] The shop displays ten common cards and exactly the selected unlocked character's training.
- [ ] Cards show correct price/progression and update after successful purchase; locked characters and the three old passive products are absent.
- [ ] Existing merchant recruitment remains available and the shop layout stays usable at desktop and narrow viewport widths.

## Validation
- `npm run typecheck --workspace @caravan/web` — component props and profile fields typecheck.
- `npm run build --workspace @caravan/web` — production bundle builds.
- Manual: open the shop with profiles containing Warrior only and all four characters; verify selector contents, prices, disabled states, profile refresh, atlas alignment, and responsive layout.

## Commit Message
```text
feat(shop): display shared upgrades and character training

Plan: 2026-10-29-caravan-shop-upgrades
Phase: P01-shop-progression
Task: T02-shop-ui

- Add unlocked-character selector and training cards
- Reuse pixel icon atlas for all common upgrades
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
