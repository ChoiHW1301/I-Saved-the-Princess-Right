# Task: T04 Web release and persistent flow verification

## Status: pending

## Goal
Deploy the React app to the existing Static Web App and verify DEX login, profile, run save/resume, and top-10 leaderboard data through the Function API.

## Decision Summary
- Use the existing DEX Web/API app registrations and `CaravanGame.Player` role gate. Direct API origin is `https://caravan-grill-api-e21002.azurewebsites.net`.
- Use only a designated DEX test user for live writes. Keep local `http://localhost:5173/` SPA redirect.

## Implementation

### I01. SPA config and deployment
- Related Files:
  - `apps/web/src/auth/apiUrl.ts` :: `apiUrl` — read-only.
  - `scripts/deploy-web.ps1` :: build and SWA publish — modify to require `VITE_API_BASE_URL` when publishing.
  - `apps/web/.env.example` :: add documented public `VITE_API_BASE_URL` example; modify.
  - `docs/deployment/release-checklist.md` — record live checks; modify.
- **Signatures & Types**: Vite public environment variables `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_WEB_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`, `VITE_API_BASE_URL`, `VITE_LOCAL_PLAYTEST=false`; no secrets in client bundle.
- **Execution Flow / Logic**: find the exact `Caravan Escort Web` registration, add `https://calm-hill-0358c1a00.6.azurestaticapps.net/` as an SPA redirect while retaining localhost. Set process-scoped build variables, deploy to existing `caravan-grill-e21002` using the script. If app-registration ownership is missing, ask only its owner for the redirect update.

### I02. Live test
- Related Files:
  - `apps/web/src/features/profile/profileApi.ts` :: profile API — read-only.
  - `apps/web/src/features/run/RunController.ts` :: save/resume — read-only.
  - `apps/web/src/features/leaderboards/LeaderboardPage.tsx` :: top-10 display — read-only.
- **Data & Schema Fields**: profile contains gold/unlocks/permanent and character upgrades; current run has revision and snapshot; leaderboard partitions by boardId and returns top 10.
- **Execution Flow / Logic**: test account signs in, changes one inexpensive profile upgrade, reloads to verify persistence, saves a run and resumes, submits a test score via normal run completion, and confirms ranking. If live interactive sign-in is unavailable, stop at the verified deployment boundary and identify only the user action required.

## Acceptance Criteria
- [ ] Production web uses the direct Function origin and DEX Entra login.
- [ ] Authorized test user sees profile changes and save/resume after refresh.
- [ ] Test result appears in the top-10 leaderboard when qualifying.

## Validation
- `npm run build --workspace @caravan/web` — success with production Vite variables.
- `./scripts/deploy-web.ps1 -ResourceGroup grill-me-edu -StaticSiteName caravan-grill-e21002` — publish succeeds.
- `Invoke-WebRequest https://calm-hill-0358c1a00.6.azurestaticapps.net/ -UseBasicParsing` — HTTP 200.
- Browser test with DEX test user — profile/save/leaderboard round trips.

## Commit Message
```text
ops(azure): release caravan web with persistent API

Plan: 2026-11-17-caravan-shared-cosmos-persistence
Phase: P01-azure-connection
Task: T04-web-verification

- Build the web app against the dedicated Function origin
- Verify DEX sign-in and persistent game flows
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
