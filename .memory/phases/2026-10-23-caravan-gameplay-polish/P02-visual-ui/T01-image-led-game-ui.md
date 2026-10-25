# Task: T01 Image-Led Main Screen, HUD, and Pause UI

## Status: done

## Goal

Replace text-only main-screen and in-game controls with medieval-fantasy pixel-art UI assets, present essential HUD values with matching icons and numbers, and remove gameplay instructions and unlock explanations.

## Decision Summary

- Keep essential live values and live choice labels, but remove lower-left controls/how-to-play text and text that explains how to unlock characters/content.
- Use medieval-fantasy pixel panels and image icons that match the game art. Keep readable dynamic numbers and choice labels in DungGeunMo.
- Do not add an aspect-ratio control; P01 fixed the complete game composition at 4:3.

## Implementation

### I01. Create image-based UI assets

- Related Files:
  - `apps/web/public/game-assets/ui/panel-frame.svg` :: reusable game panel border image; new
  - `apps/web/public/game-assets/ui/icon-player-health.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-caravan.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-level.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-experience.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-time.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-kills.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-gold.png` :: pixel-art resource icon; new
  - `apps/web/public/game-assets/ui/icon-pause.png` :: pixel-art control icon; new
  - `apps/web/public/game-assets/ui/icon-shop.png` :: pixel-art navigation icon; new
  - `apps/web/public/game-assets/ui/icon-ranking.png` :: pixel-art navigation icon; new
  - `apps/web/public/game-assets/ui/icon-start.png` :: pixel-art action icon; new
  - `apps/web/public/game-assets/ui/icon-continue.png` :: pixel-art action icon; new

#### Details

- Build `panel-frame.svg` as a 96 x 96 nine-slice-compatible transparent frame with a 16-pixel ornamental border and transparent center; use `border-image-slice: 16 fill` so the art scales without stretching its corners.
- Generate each icon as an individual transparent 64 x 64 PNG, crisp nearest-neighbor pixel art, warm parchment/gold/iron palette, no letters or numerals, centered in the canvas with safe margin. The images depict the named resource/action unambiguously.
- Keep the SVG/PNG artwork independent from text so labels remain accessible and localizable. No unlock-condition art or text is added.

### I02. Convert HUD to icon-plus-value layout

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `preload`, `statusText`, `refreshHud`, `drawHealthBars`; modify
  - `apps/web/src/game/config/createGameConfig.ts` :: game dimensions; read-only
  - `apps/web/src/game/test/CaravanScene.test.ts` :: HUD data formatting helpers; modify

#### Details

- Replace the single text string in `refreshHud()` with a compact image-led HUD arranged inside the fixed 960 x 720 world: player-heart icon + current/max HP, caravan icon + current/max durability, level icon + level, experience icon + current/required XP, time icon + elapsed campaign time, and kills icon + kill count.
- Use the new icon images as Phaser image objects, pixel-art render settings, fixed logical world positions anchored to the screen edges, and `DungGeunMo` for dynamic numbers. Keep health bars, but place them in matching framed panels.
- Avoid exposing variable names, unlock criteria, upgrade explanations, or control instructions in the HUD.
- Add `icon-gold.png` and any newly created pickup icons from P01 only where a live gold/reward amount is actually shown; do not duplicate static explanatory copy.

### I03. Restyle React main screen and pause control

- Related Files:
  - `apps/web/src/features/home/HomePage.tsx` :: `HomePage` active-game and home render branches; modify
  - `apps/web/src/features/home/HomePage.css` :: `.game-shell`, `.game-frame`, `.game-hint`, `.home-shell`, `.welcome-banner`, `.side-nav`, `.game-pause-button`, `.run-dialog`; modify
  - `apps/web/src/game/GameCanvas.tsx` :: pause button, pause dialog; modify
  - `apps/web/src/features/home/HomePage.test.tsx` :: removed-copy and accessible-control checks; new if absent

#### Details

- Remove `.game-hint` from the active-game render branch and remove instruction/unlock explanatory strings from the main screen and character-selection entry flow. Retain story copy, button names, account feedback, and dynamic choice labels required to operate the app.
- Replace the textual pause glyph `Ⅱ` with `/game-assets/ui/icon-pause.png`, wrapped in a visually integrated medieval-fantasy button frame. Preserve `aria-label="게임 일시 정지"` and keyboard focus visibility.
- Restyle the main welcome panel, navigation controls, primary/secondary actions, and pause dialog with the generated frame image and individual action/navigation icons. Keep semantic button text labels alongside icons.
- Maintain the fixed 4:3 game frame established in P01; do not reintroduce responsive content repositioning inside the Phaser world.
- Keep existing pause actions and behavior: save and return to camp, or resume play. This task changes their visual presentation only.

### I04. Validate UI readability and flow

- Manual check at wide desktop, 4:3 window, and narrow window: UI artwork scales without obscuring the game field; the game canvas itself retains the fixed 4:3 ratio with margins.
- Verify player/caravan health, level, experience, elapsed time, and kills remain readable and update during play.
- Verify the home screen starts/continues a run, shop/ranking navigation still works, the pause button is keyboard accessible, and both pause actions still work.
- Verify no game hint, mechanics explanation, or unlock condition appears in the relevant screens.

## Acceptance Criteria

- [ ] The home screen, essential HUD, pause control, and pause dialog use image-backed medieval-fantasy pixel UI rather than plain text-only presentation.
- [ ] Essential values remain readable as icons plus numbers; actionable choices keep readable labels.
- [ ] Lower-left control instructions and explanatory unlock/gameplay text are removed.
- [ ] Pause control is an image asset with an accessible Korean label and existing pause/save/resume behavior.
- [ ] The fixed 4:3 composition scales uniformly with browser size and does not stretch or crop.

## Validation

- `npm run test --workspace @caravan/web`
- `npm run typecheck --workspace @caravan/web`
- `npm run build --workspace @caravan/web`
- Browser visual and interaction checks described in I04.

## Commit Message

```text
feat(ui): add image-led fantasy game interface

Plan: 2026-10-23-caravan-gameplay-polish
Phase: P02-visual-ui
Task: T01-image-led-game-ui

- Add pixel-art icons and framed interface panels
- Remove gameplay instructions and unlock explanations
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual browser readability/responsive interaction check (preview tool could not attach)
- commit: not created because the worktree contains extensive pre-existing edits; staging these files wholesale would include unrelated work

