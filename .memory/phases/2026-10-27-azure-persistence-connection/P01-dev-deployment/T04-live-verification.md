# Task: T04 Verify DEX Authentication and Persistence

## Status: superseded

Live verification for the replacement resources is defined in [T05](../../2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/T05-live-verification.md). This old-group verification task is retained as history only.

## Goal
Confirm a dedicated DEX user with the `CaravanGame.Player` role can play and that profile, current run, and leaderboard data round-trip through the deployed API.

## Decision Summary
- User has confirmed the employee group role assignment and admin consent. Verify with a dedicated test account; a real user sign-in requires the user to complete the browser interaction.
- Do not use production users or submit test score data to a production environment.

## Implementation

### I01. Verify browser identity and profile
- Related Files:
  - `docs/deployment/release-checklist.md` :: browser authentication and gameplay checklist — follow.
  - `apps/web/src/features/auth` :: sign-in flow — observe only unless an actual defect is found.
- Details:
  - Open the deployed Static Web App and sign in with a dedicated DEX employee account assigned through the DEX group.
  - Confirm `/api/me` and `/api/profile` load without displaying or copying access tokens.
  - If the user lacks role propagation, sign out/in and allow directory assignment propagation; record only result and timestamp, not identity data.
  - If a dedicated nonmember test account is available, confirm API denial (403); do not ask the user to use personal credentials.

### I02. Verify persistence flows
- Related Files:
  - `apps/api/src` profile/save/leaderboard handlers — observe via client.
  - `docs/deployment/release-checklist.md` :: current-save and leaderboard checks — follow.
- Details:
  - In the dev app only, make a small profile change such as a single run reward, refresh, and confirm profile data persists.
  - Save an in-progress run, refresh, choose resume, and confirm the run state is restored.
  - Complete a short test run only if the game's current flow supports it; confirm score/clear records appear in the expected dev leaderboard.
  - Avoid deleting data or adding cleanup endpoints; use only the dedicated test account.

## Acceptance Criteria
- [ ] DEX assigned user authenticates and the API accepts the `CaravanGame.Player` role.
- [ ] Profile changes persist after refresh.
- [ ] Current run can be saved and resumed after refresh.
- [ ] Leaderboard data is returned for the test account if the corresponding run submission path is exercised.

## Validation
- Browser check against `https://<static-hostname>/` — expected DEX login, protected profile load, and save/resume success.
- `./scripts/smoke-test.ps1 -Mode Release` with `GAME_BASE_URL=https://<static-hostname>` — expected HTTP health and anonymous auth checks pass.

## Commit Message
```text
docs(azure): record development persistence verification

Plan: 2026-10-27-azure-persistence-connection
Phase: P01-dev-deployment
Task: T04-live-verification

- Record DEX sign-in and profile/save/leaderboard verification outcomes
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
