# Plan: Caravan Gameplay and UI Polish

## Goal

Polish the caravan escort game around a fixed 4:3 playfield, physically triggered road encounters, clearer combat feedback, a gradual early-to-midgame difficulty curve, collectible rewards, monster-specific death animation, and image-led medieval fantasy UI. Preserve save/resume compatibility and the existing three-minute event and five-minute mini-boss schedule.

## Decisions

See [confirmed decisions](../decisions/2026-10-23-caravan-gameplay-polish.md). Event story and reward balance are explicitly deferred; this plan changes event presentation and trigger timing only.

## Phases

| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `implemented` | Fixed 4:3 world alignment, physical events, warning feedback, monster progression and reward pickups | [P01](../phases/2026-10-23-caravan-gameplay-polish/P01-world-gameplay/phase.md) |
| P02 | `implemented` | Image-led home screen, HUD, and pause UI; remove instructional and unlock copy | [P02](../phases/2026-10-23-caravan-gameplay-polish/P02-visual-ui/phase.md) |

Automated validation passes. Manual browser play/visual QA remains pending because the computer-use browser tab could not attach. Changes are left uncommitted to avoid sweeping the many pre-existing worktree edits into a commit.

## Execution Order

1. P01-T01: Fixed 4:3 viewport and centered road
2. P01-T02: Approaching events, mini-boss warnings, and damage border
3. P01-T03: Difficulty curve, rare reward monster, pickups, and death animation
4. P02-T01: Pixel-art UI assets, HUD, main screen, and pause interface

