# Task: T04 Web release and persistent flow verification

## Status: done

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
- **Execution Flow / Logic**: find the exact `Caravan Escort Web` registration, add `https://calm-hill-0358c1a00.6.azurestaticapps.net/redirect.html` as an SPA redirect while retaining localhost. MSAL Browser 5 uses a dedicated redirect bridge page. Set process-scoped build variables, deploy to existing `caravan-grill-e21002` using the script. If app-registration ownership is missing, ask only its owner for the redirect update.

### I02. Live test
- Related Files:
  - `apps/api/src/auth/authorize.ts` :: validate Entra v1/v2 access tokens against version-specific issuers, keys, and audiences; modify after live 401.
  - `apps/api/test/auth/authorize.test.ts` :: cover v1 and v2 verification, wrong audience, and optional display name; modify.
  - `apps/api/src/data/profileRepository.ts` and `repositorySupport.ts` :: submit a transactional Cosmos batch using the SDK's operations-array API; modify after live run submission 500.
  - `apps/api/test/data/repositories.test.ts` :: verify the actual SDK batch call shape; modify.
  - `infra/shared-cosmos-game.bicep` :: define the leaderboard composite index required by score and tie-breaker ordering; modify after live 503.
  - `apps/web/src/features/profile/profileApi.ts` :: profile API — read-only.
  - `apps/web/src/features/run/RunController.ts` :: serialize overlapping saves and distinguish server errors; modify.
  - `apps/web/src/features/run/SaveResume.test.ts` :: verify overlapping saves use consecutive revisions; modify.
  - `apps/web/src/game/GameCanvas.tsx` and `scenes/CaravanScene.ts` :: suppress late pause/save events after run end; modify.
  - `apps/web/src/features/leaderboards/LeaderboardPage.tsx` :: top-10 display — read-only.
- **Data & Schema Fields**: profile contains gold/unlocks/permanent and character upgrades; current run has revision and snapshot; leaderboard partitions by boardId and returns top 10.
- **Execution Flow / Logic**: test account signs in, changes one inexpensive profile upgrade, reloads to verify persistence, saves a run and resumes, submits a test score via normal run completion, and confirms ranking. If live interactive sign-in is unavailable, stop at the verified deployment boundary and identify only the user action required.

## Acceptance Criteria
- [x] Production web uses the direct Function origin and DEX Entra login.
- [x] Authorized test user sees profile changes and save/resume after refresh.
- [x] Test result appears in the top-10 leaderboard when qualifying.

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
- 2026-11-17: Required `VITE_API_BASE_URL` in `scripts/deploy-web.ps1` and validated it as an HTTPS Function origin; added the documented example. The script can use an installed `swa` or fetch the official CLI from npm without a global install.
- 2026-11-17: Built and published the web app to `https://calm-hill-0358c1a00.6.azurestaticapps.net`. The site returned HTTP 200; the deployed bundle contains the intended public IDs and direct Function origin. Function CORS preflight returned 204 with the matching origin.
- 2026-11-17: Interactive sign-in reached Entra but returned AADSTS50011 for the exact redirect URI `https://calm-hill-0358c1a00.6.azurestaticapps.net`. The Web SPA registration must add this URI without a trailing slash. The CLI's Microsoft Graph MFA session is expired; user was asked to add the URI in Entra. Profile/save/leaderboard round trips remain pending.
- 2026-11-17: The user added the original root redirect, but the app returned to the login screen; the old bundle showed an OAuth token HTTP 400. MSAL Browser 5 requires a redirect bridge. Added `/redirect.html` as a separate Vite entry, switched the SPA redirect URI to that page, and fixed the `/api/me` authorization check to use the Function origin. Registration of the new bridge URI and live round trips remain pending.
- 2026-11-17: Deployed the redirect bridge and confirmed `/redirect.html` returns HTTP 200 with only the bridge script and no COOP header. User registered the new URI. The next sign-in returned AADSTS9002326 on the browser token request with `redirect_uri` set correctly to `/redirect.html`; the Entra registration is treating that URI as a non-SPA client type. Requested a screenshot of the Web registration's platform configuration. Actual sign-in and persistent round trips remain unverified.
- 2026-11-17: The Entra authentication screenshot confirmed both production URIs, including `/redirect.html`, were under the Web platform while the SPA platform contained only localhost. Asked the user to move `/redirect.html` from Web to SPA; this directly explains AADSTS9002326.
- 2026-11-17: After the redirect was moved to SPA, Entra sign-in reached the Function but `/api/me` returned HTTP 401. The API accepted only v2 access-token issuer and audience, while the API registration can issue v1 tokens by default. Added version-specific signature/issuer/audience validation and made the optional `name` claim display-only; API tests (32) and build pass. Live redeployment and user verification remain pending.
- 2026-11-17: Redeployed the API. Health returned 200 and unauthenticated `/api/me` returned 401. The DEX user confirmed the game home screen opens after sign-in, which also requires successful profile loading. Live save/resume and leaderboard checks are next.
- 2026-11-17: User reported a 409 on PUT `/api/save` after resuming, a Phaser pause exception, and a 500 on POST `/api/runs` after death. Serialized overlapping save requests in `RunController`; stopped late snapshot and pause events after run end. Found the run 500 was caused by a fluent Cosmos batch call that does not exist in the installed JavaScript SDK; replaced it with `batch(operations, partitionKey)`. API 32 tests and web 107 tests pass locally. Deployment and live retry remain pending.
- 2026-11-17: Redeployed API and web fixes. API health returned 200 and the web returned 200 with the new bundle. Asked the user to retry the pending result from IndexedDB, then recheck save/resume and leaderboard.
- 2026-11-17: The user retried the previously pending result and confirmed gold was credited. Score leaderboard and fresh save/resume checks remain pending.
- 2026-11-17: Score leaderboard returned 503. The live `leaderboards` container had no composite index, but both ranking queries sort by score, kills, elapsed time, and display name. Added that composite index to Bicep and updated only the game's leaderboard container in Azure; waiting for the index transformation and a user ranking retry.
- 2026-11-17: The DEX test user confirmed the score ranking loads and a new run can be saved, resumed, played, and saved again. Gold was credited from the retried result. API tests 32/32, web tests 107/107, both typechecks, and Bicep build passed.
- commit: see the T04 commit message above
