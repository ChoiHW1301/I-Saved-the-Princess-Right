# Task: T02 Physical Events, Warnings, and Damage Border

## Status: done

## Goal

Make each scheduled event appear as a visible road encounter that approaches the caravan and triggers on contact. Keep combat and time running during approach, pause only after contact, warn five seconds before mini-bosses, and make the red damage border more visible.

## Decision Summary

- Events stay scheduled at 180, 360, 540, and 720 seconds.
- An encounter appears ahead of the caravan at the right edge of the horizontal road, moves left at 90 world pixels/second, and triggers when it overlaps the caravan's 124-pixel half-width plus a 24-pixel encounter radius.
- Normal combat and campaign time continue until contact. On contact, `EventSystem.present()` runs, `CampaignClock` pauses, and the existing choice overlay opens.
- The current story text and choice outcomes remain placeholders and are not redesigned here.
- Mini-boss warnings begin at 295 and 595 seconds and show for five seconds at the upper center.

## Implementation

### I01. Add a resumable approaching-event state

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: state fields, `create`, `update`, `chooseEvent`, `createRunSnapshot`; modify
  - `apps/web/src/game/content/events.ts` :: `StoryEvent` and `eventCatalog`; read-only for current event IDs
  - `apps/web/src/game/bridge/GameEventBus.ts` :: `GameEvents`; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `SnapshotInput`, `createSnapshot`; modify
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema`; modify
  - `packages/contracts/test/schema.test.ts` :: legacy and encounter snapshot validation; modify
  - `apps/web/public/game-assets/encounters/wounded-messenger.png` :: new encounter art
  - `apps/web/public/game-assets/encounters/abandoned-supply-cart.png` :: new encounter art
  - `apps/web/public/game-assets/encounters/captured-scout.png` :: new encounter art
  - `apps/web/public/game-assets/encounters/village-refugees.png` :: new encounter art

#### Details

- Add `ApproachingEventState = { eventId: string; x: number } | null` to `CaravanScene`; Y is always `ROAD_CENTER_Y`.
- When `CampaignClock.update()` emits an event milestone, mark it as approaching and load the matching encounter sprite. Do not call `EventSystem.present`, pause the clock, pause the scene, or emit `story-event` yet.
- Start at `x = WORLD_WIDTH + 80`, move left by `90 * delta / 1000`, and test overlap against `124 + 24 = 148` horizontal pixels from the caravan center. On overlap, destroy the approach sprite, call `EventSystem.present(eventId, run)`, pause the campaign with `event:${eventId}`, set `uiPaused = true`, pause the scene, and emit `story-event` once.
- Preload one transparent 96 x 96 pixel-art image for each current event ID listed in Related Files. Each image must depict its named encounter, match the current medieval-fantasy pixel art palette, and contain no text.
- Add `approachingEvent` to `RunSnapshotV1Schema` as an optional nullable object `{ eventId: IdSchema, x: CoordinateSchema }`, defaulting to `null`. `createSnapshot` writes current ID and X while an event is approaching; `restoreSnapshot` preserves it. The milestone restoration filter must treat an approaching event as already emitted, preventing duplicate spawns.
- On restore, recreate the corresponding event sprite at its saved X and continue its approach. Old V1 snapshots without this field parse as `null`.
- Existing event choice application and event text remain unchanged.

#### Data & Schema Fields

- `RunSnapshotV1.approachingEvent`: `{ eventId: string; x: number } | null`, optional with default `null` for old saves.
- `GameEvents['mini-boss-warning']`: `{ milestoneId: string; remainingSeconds: number }`.

### I02. Show five-second mini-boss warning and larger damage border

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `update`, `drawDamageFlash`, `showDamageFlash`; modify
  - `apps/web/src/game/bridge/GameEventBus.ts` :: `GameEvents`; modify
  - `apps/web/src/game/GameCanvas.tsx` :: event subscriptions and overlay render; modify
  - `apps/web/src/features/home/HomePage.css` :: warning/banner styling as needed; modify

#### Details

- Before each mini-boss milestone, emit `mini-boss-warning` once when campaign time crosses `milestone.atSeconds - 5`. The warning itself does not pause or stop the campaign.
- In `GameCanvas`, show the exact message `Warning!! 수상한 기운이 접근합니다!` as a horizontal upper-center banner for those five seconds; clear it when the matching `boss-encounter` arrives or the run exits.
- Increase all four edges of the existing red damage frame from outer/inner thickness 34/15 to 68/30 logical pixels. Preserve current opacity colors and 360 ms fade timing unless visual inspection requires a small alpha adjustment for legibility.

#### Execution Flow / Logic

1. Compare `CampaignClock.elapsedSeconds` against each un-emitted mini-boss warning threshold.
2. Emit one warning event per mini-boss milestone and update remaining display time from game time.
3. At the existing mini-boss milestone, let `startBoss()` proceed with the already existing boss pause behavior and clear the warning overlay.
4. Every accepted player or caravan hit continues to call `showDamageFlash()`; the effect now paints wider edge bands on all sides.

### I03. Add focused tests

- Related Files:
  - `apps/web/src/game/test/CaravanScene.test.ts` :: event threshold, warning threshold, and one-shot behavior; modify
  - `apps/web/src/game/test/CampaignClock.test.ts` :: pause/resume milestone behavior; modify
  - `packages/contracts/test/schema.test.ts` :: old and new snapshot forms; modify

#### Details

- Assert every event's schedule milestone creates approach state and does not immediately pause the clock.
- Assert contact creates the pending event and pauses; resolving the choice resumes the clock exactly once.
- Assert save/restore during approach retains event ID/X and does not spawn a duplicate when elapsed time already passed the milestone.
- Assert mini-boss warning fires once at five seconds before 300/600 seconds and is cleared by boss arrival.

## Acceptance Criteria

- [ ] Every existing three-minute event visibly approaches on the road and opens only after touching the caravan.
- [ ] Combat and time continue during event approach; the choice pause starts on contact.
- [ ] Saving and resuming during approach does not lose or duplicate the encounter.
- [ ] Both mini-boss warnings appear horizontally near the upper center exactly five game seconds before the boss.
- [ ] Player and caravan hits produce a clearly wider red border flash.

## Validation

- `npm run test --workspace @caravan/contracts -- test/schema.test.ts`
- `npm run test --workspace @caravan/web -- src/game/test/CampaignClock.test.ts src/game/test/CaravanScene.test.ts`
- `npm run typecheck --workspace @caravan/web`
- Browser play check at 180/300/360/600/720 seconds, including save/resume during an event approach.

## Commit Message

```text
feat(game): make events physical road encounters

Plan: 2026-10-23-caravan-gameplay-polish
Phase: P01-world-gameplay
Task: T02-physical-events-and-warnings

- Approach event sprites before pausing for a choice
- Warn before mini-bosses and expand edge-hit feedback
```

## Progress

- [x] Implementation complete
- [x] Automated validation passed
- [ ] Manual browser event/warning check (preview tool could not attach)
- commit: not created because the worktree contains extensive pre-existing edits; staging these files wholesale would include unrelated work

