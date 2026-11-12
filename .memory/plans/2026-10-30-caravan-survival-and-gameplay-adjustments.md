# Plan: Caravan Survival and Gameplay Adjustments

## Goal
Align the road under the centered wagon, make the Warrior attack less often, reserve space for the pause button in the HUD, prevent enemies from crossing the wagon, and add five-second limited revives purchased through a three-rank permanent shop upgrade with a visible saved countdown.

## Confirmed Decisions
- Warrior sword interval: 1500 ms.
- Shift the background downward by raising the road vertical offset from 34 to 84 world pixels; retain the centered wagon and 4:3 screen.
- End the HUD background panel around x=880, before the pause button.
- Use the existing 224×72 wagon collision rectangle for enemies: wagon-target enemies attack from its outside edge; player-target enemies route around it.
- Each of three permanent revive-upgrade ranks grants one per-run revive charge; rank costs are 100, 125, and 150 G. Start at 0. Death consumes one charge, starts a five-second countdown, and revival restores full HP with the existing two-second invulnerability. Death at zero charges ends the run immediately.
- Display remaining countdown seconds below the karma gauge only while revival is pending; save and restore the remaining charge count and countdown.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Implement limited revive state and HUD, three-rank shop purchase, lower road/HUD adjustment, slower Warrior, and enemy collision/pathing around the wagon. | [P01](../phases/2026-10-30-caravan-survival-and-gameplay-adjustments/P01-survival-collision-and-hud/phase.md) |

## Scope Notes
- Preserve current revive healing and two-second invulnerability behavior unless the new no-charge outcome requires run loss.
- The fixed 4:3 frame and 75% battlefield view remain unchanged.
- Do not run the test suite. Use typecheck/build only; update existing type fixtures where needed.
- Existing dirty working-tree changes overlap several game files. Do not stage or commit unrelated changes.
