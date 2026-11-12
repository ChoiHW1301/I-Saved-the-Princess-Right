# Plan: Caravan Revive Presentation

## Goal
Show half-health revivals clearly with a remaining-life HUD indicator and a brief descending light beam at the revive location.

## Decisions
- Revival HP is `ceil(maxHp / 2)`.
- Each remaining revive charge is represented by a winged heart beneath the player health bar.
- Reuse the existing heart atlas frame and angel wing texture.
- A light column descends onto the player when the revive timer completes.

## Phase
- P01: update revive restoration, create/update winged-heart indicators, add a one-shot revival beam effect, and align the existing survival fixture.

## Scope
- Keep the current five-second revive timer, limited revive count, and two-second invulnerability unchanged.
- Run contracts/web typecheck and web build only; do not run tests.
