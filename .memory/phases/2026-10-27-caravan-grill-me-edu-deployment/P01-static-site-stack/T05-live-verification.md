# Task: T05 Verify DEX Sign-in and Persistent Game Data

## Status: pending

## Goal
Verify that an assigned DEX employee can play through the new Static Web App and that profile, run-save, and leaderboard data persist through the dedicated API and Cosmos database.

## Decision Summary
- Use a dedicated DEX test account assigned through `CaravanGame.Player`; browser sign-in requires the user to perform an interactive login.
- Verify the new Free SWA and direct Function API only. Do not use the old resource group for new gameplay data.

## Implementation

### I01. Verify authentication and API boundary
- Related Files:
  - `docs/deployment/release-checklist.md` :: authentication and play checks — follow/update outcomes.
  - `apps/web/src/auth` :: MSAL flow — observe only unless an actual defect is found.
  - `apps/api/src/auth/authorize.ts` :: role/token checks — observe only unless an actual defect is found.
- Details:
  - Open `https://<new-swa-hostname>/` and sign in as the authorized DEX test user.
  - Confirm the browser returns to the new SWA and `/api/me` and `/api/profile` succeed.
  - Confirm a request without a token returns 401, and a valid signed-in user without `CaravanGame.Player` (if a test account is available) returns 403. Do not ask the user to expose credentials or copy tokens.

### I02. Verify persistence flows
- Related Files:
  - `apps/api/src/services/profileService.ts`, `saveService.ts`, `leaderboardService.ts` — read-only behavior targets.
  - `docs/deployment/release-checklist.md` — record outcomes.
- Details:
  - Make a small development profile change, refresh, and confirm it persists.
  - Start a run, save it, refresh, resume it, and confirm saved run state returns.
  - Exercise a score/clear submission only through an available test-game flow and confirm the new development leaderboard returns the record.
  - Use only the dedicated test account; do not write real employee gameplay data.

## Acceptance Criteria
- [ ] Assigned DEX user signs in and receives authorized API responses.
- [ ] Profile state persists after refresh.
- [ ] Current run can be saved and resumed after refresh.
- [ ] Leaderboard data persists and is returned if the game flow can submit a test result.

## Validation
- Browser test at `https://<new-swa-hostname>/` — expected sign-in, protected profile load, save/resume success.
- `$env:GAME_BASE_URL='https://<function-host>'; ./scripts/smoke-test.ps1 -Mode Release` — expected health and unauthenticated route assertions pass.

## Commit Message
```text
docs(azure): record live DEX persistence verification

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T05-live-verification

- Record sign-in, profile, save/resume, and leaderboard checks
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
