# Task: T01 Shop Revival Fix

## Status: in_progress

## Changes
- Put all 11 upgrades in the existing five-column grid; revive is the final same-size card.
- Overlay an upward yellow arrow on the heart icon for health regeneration.
- Map stale-server `INVALID_UPGRADE` responses to a specific explanation.
- Persist the local playtest profile/save/leaderboard in `apps/web/.local-playtest-state.json` (ignored by Git).
- Rebuilt contracts and API so a fresh local runtime accepts `extra-lives`.

## Validation
- Contracts/API build and web typecheck/build pass. Tests not run.
- Manual runtime verification is pending because tool policy rejected stopping the existing user-owned Vite process (PID 32240).

## User Step
From the terminal currently running Vite, press Ctrl+C, then run `npm run dev --workspace @caravan/web` from the repository root. Local playtest state has been captured and will be restored by the updated dev API.
