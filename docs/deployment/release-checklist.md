# Release verification checklist

Record the release version, environment, operator, date, and outcome in the team's release record. Use dedicated test identities and never record passwords, bearer tokens, or personal data in the record.

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
