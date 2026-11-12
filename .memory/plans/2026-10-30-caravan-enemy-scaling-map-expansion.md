# Plan: Caravan Enemy Scaling and Arena Expansion

## Goal
Set the ghoul, imp, and Golden Imp base HP to 10, 8, and 20; scale every spawned enemy's HP continuously from its base HP using the player's level and elapsed run time; and make the playable arena feel more open by fitting a larger world into the existing fixed 4:3 game frame with proportionally smaller world sprites.

## Confirmed Decisions
- Enemy HP at spawn: `ceil(baseHp * (1 + max(0, playerLevel - 1) * 0.15 + max(0, elapsedSeconds) / 60 * 0.15))`.
- Use fractional elapsed minutes, so HP can change at every second's spawn; do not retain the old 150-second delay, 120-second step, or wagon-priority exemption.
- Apply the scale to regular enemies, the reward enemy, minibosses, and final bosses.
- Rename the reward enemy to Golden Imp (`golden-imp`) and set its base HP to 20.
- Keep the fixed 4:3 composition and the wagon at the visible center. Fit the entire world to the same game frame at 75% world display scale, which increases visible world dimensions by about 1.33× while shrinking world sprites. Keep HUD legible at its existing apparent screen size.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | Apply continuous level/time HP scaling to all enemy spawn paths and enlarge the visible arena while preserving fixed 4:3 framing. | [P01](../phases/2026-10-30-caravan-enemy-scaling-map-expansion/P01-enemy-scaling-and-arena/phase.md) |

## Scope Notes
- Azure deployment, shop progression, enemy damage/speed scaling, and new art are out of scope.
- Legacy save entries named `fortune-wraith` must restore as `golden-imp`; preserve their reward-monster behavior and existing reward art.
- Existing save coordinates are mapped from their saved world dimensions into the new dimensions by `mapSnapshotWorldPoint`.
- Validation uses typecheck/build only. Do not add or run tests for this task.
