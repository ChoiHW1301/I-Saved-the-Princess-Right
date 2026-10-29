# Plan: Caravan Taunt and Shop Layout

## Goal
Add a one-time Warrior Taunt training that redirects nearby wagon-priority enemies, make enemy sprites face their horizontal movement, and revise the shop so all ten common upgrades stay in a responsive five-column grid while character training cards show every entry and align consistently.

## Confirmed Decisions
- Taunt is a passive Warrior training bought once for 500 G. Within a 300 px radius of the Warrior, wagon-priority enemies target the Warrior; outside that radius they resume their normal target policy. It affects existing and newly spawned enemies through the existing 250 ms target refresh. The visualization is a high-transparency yellow circle, shown only after unlocking Taunt. If the Warrior is dead, retain the existing caravan-target fallback.
- Enemy sprites face the horizontal direction in which they move and retain their last facing while stationary or moving vertically.
- Keep all ten common upgrades in five columns and two rows at every viewport width. Cards and contents shrink proportionally to available width; use neither fewer columns nor horizontal scrolling.
- Show every training belonging to the selected unlocked character. Keep the UI data-driven for future entries (about three per character); an unlock-only training reserves the same vertical space as a rank progress bar.
- Preserve other training costs and behavior.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Add Taunt gameplay and catalog entry, render multiple training cards and the fixed five-column common-upgrade grid, and orient enemy sprites by movement. | [P01](../phases/2026-10-29-caravan-taunt-and-shop-layout/P01-taunt-shop-and-enemy-visuals/phase.md) |

## Scope Notes
- Azure deployment and persistence are out of scope; this is local game/shop work.
- Existing profiles store training levels by `TrainingId`; adding the new ID should keep old profile documents readable.
- No changes are planned to existing training costs, active ability controls, save snapshots, or caravan target fallback.
