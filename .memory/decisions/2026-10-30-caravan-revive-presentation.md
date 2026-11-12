# Decision: Caravan Revive Presentation

## Confirmed Requirements
- Revival restores half of the player's maximum health.
- Show one winged heart below the upper-left health bar for each remaining revive charge.
- When revival completes, play a descending beam of light onto the player's position.

## Implementation Choices
- Round restored health up to the next whole point with `Math.ceil(maxHp / 2)`.
- Reuse the existing angel-wing and heart HUD atlas assets; no new external image dependency.
- Reconcile the visible winged-heart count from `respawnsRemaining` every HUD refresh, so each consumed life disappears immediately.
- Play the beam effect only after the five-second revive completes, then remove it automatically.

## Validation
- Contracts/web typecheck and web production build.
- Do not run tests. Existing survival expectation will be updated to reflect half-health revival.
