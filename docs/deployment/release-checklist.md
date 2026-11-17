# Release verification checklist

Record the release version, environment, operator, date, and outcome in the team's release record. Use dedicated test identities and never record passwords, bearer tokens, or personal data in the record.

## Shared Cosmos account for Caravan

The Caravan deployment in `grill-me-edu` uses the existing `maze-rescue-ms-b7af62a9` account and its own `caravan-game` database. Provision only with `infra/shared-cosmos-game.bicep`. The older `infra/main.bicep` provisions a separate Cosmos account and must not be rerun for this connection. The database uses 400 RU/s shared by `profiles`, `saves`, and `leaderboards`; this reserved throughput can incur charges beyond the account's free-tier allowance.

The Function App `caravan-grill-api-e21002` uses its system-assigned managed identity. Its Cosmos DB Built-in Data Contributor assignment is scoped to `/dbs/caravan-game`. On the dedicated Storage account `caravangstge21002`, that same identity has `Storage Blob Data Owner`, `Storage Queue Data Contributor`, and `Storage Table Data Contributor` at the Storage account scope. Keep these roles off the resource group and subscription scopes; do not add shared account keys to the web app or API configuration. The API deployment and read-only release smoke checks passed on 2026-11-17. Interactive DEX sign-in, saved-run persistence, and leaderboard writes remain separate release checks.

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
