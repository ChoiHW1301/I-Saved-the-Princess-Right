# Release verification checklist

Record the release version, environment, operator, date, and outcome in the team's release record. Use dedicated test identities and never record passwords, bearer tokens, or personal data in the record.

## Shared Cosmos account for Caravan

The Caravan deployment in `grill-me-edu` uses the existing `maze-rescue-ms-b7af62a9` account and its own `caravan-game` database. Provision only with `infra/shared-cosmos-game.bicep`. The older `infra/main.bicep` provisions a separate Cosmos account and must not be rerun for this connection. The database uses 400 RU/s shared by `profiles`, `saves`, and `leaderboards`; this reserved throughput can incur charges beyond the account's free-tier allowance.

The Function App `caravan-grill-api-e21002` uses its system-assigned managed identity. Its Cosmos DB Built-in Data Contributor assignment is scoped to `/dbs/caravan-game`. On the dedicated Storage account `caravangstge21002`, that same identity has `Storage Blob Data Owner`, `Storage Queue Data Contributor`, and `Storage Table Data Contributor` at the Storage account scope. Keep these roles off the resource group and subscription scopes; do not add shared account keys to the web app or API configuration. The API deployment and read-only release smoke checks passed on 2026-11-17. The DEX user subsequently verified sign-in, a persisted result reward, score ranking, and save/resume.

The `caravan-grill-e21002` Static Web App is on the Free plan, so its production web build uses `VITE_API_BASE_URL=https://caravan-grill-api-e21002.azurewebsites.net`. The Function CORS allowlist contains `https://calm-hill-0358c1a00.6.azurestaticapps.net`. On 2026-11-17, the web published to that origin, returned HTTP 200, and its API preflight returned HTTP 204 with the expected allow-origin header. The deployed MSAL Browser 5 redirect bridge is `https://calm-hill-0358c1a00.6.azurestaticapps.net/redirect.html`; it is registered as an SPA redirect. The Function validates Entra v1 or v2 tokens with version-specific keys, issuer, and audience. The DEX user confirmed the home screen opens and loads a profile.

The first live save/resume attempt reached the API but overlapping save requests caused HTTP 409; the run result returned 500 because the profile repository used an unsupported Cosmos batch call shape. The web and API fixes were deployed on 2026-11-17; API and site health checks passed. The DEX user retried the pending result with the same run ID and confirmed gold was credited. A fresh run was then saved, resumed, and saved again successfully.

The score board initially returned HTTP 503 because its four-property `ORDER BY` required a Cosmos composite index. The index was added to the game-only `leaderboards` container and to `infra/shared-cosmos-game.bicep`; the DEX user then confirmed the ranking loaded. Other projects' containers and databases were not changed.

## Automated read-only checks

- [ ] `GET /api/health` returns HTTP 200 and `{ "status": "ok" }`.
- [ ] Unauthenticated `GET /api/me` returns HTTP 401.
- [ ] Unauthenticated `GET /api/profile` and `GET /api/save` return HTTP 401.
- [ ] Unauthenticated score and clear leaderboard endpoints return HTTP 401.
- [ ] `./scripts/smoke-test.ps1 -Mode Release` completes against the intended `GAME_BASE_URL`.

For local checks, start the web and API services, set `GAME_BASE_URL` to the local app origin, set `DEX_TEST_USER` and `NON_DEX_TEST_USER` to test-account labels, then run `./scripts/smoke-test.ps1 -Mode Local`. The script checks health and unauthenticated API boundaries only; it never asks for credentials or creates/modifies game data.

## Browser authentication and gameplay

- [ ] DEX test user assigned `CaravanGame.Player` signs in and loads `/api/me` and the player profile.
- [ ] DEX test user outside the assigned group is denied by the API (HTTP 403 after obtaining a valid API token).
- [ ] Refresh/reload the current save and confirm the same run resumes.
- [ ] Complete a nonproduction test run and confirm earned rewards/profile updates.
- [ ] Confirm the score leaderboard and clear leaderboard show the expected test result and personal rank.
- [ ] Production score submission is not used as a smoke test. Do not delete production player data. No automated cleanup endpoint is currently part of this release; clean up only isolated nonproduction test data through an approved operator process.

## Release record

| Check | Result / notes |
| --- | --- |
| Health and protected API | |
| DEX allow / non-member deny | |
| Save and resume | |
| Test rewards | |
| Score and clear leaderboards | |
| Deployment version / rollback package | |
