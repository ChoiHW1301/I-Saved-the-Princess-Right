# Task: T02 Entra/Azure 운영 설정 및 스모크 검증

## Status: done

## Goal
운영 담당자가 DEX Entra 앱·그룹과 Azure 리소스를 연결하고, 인증·저장·게임·랭킹의 출시 전 흐름을 검증할 수 있는 절차를 제공한다.

## Decision Summary
- Entra app registration과 DEX 그룹은 회사 환경에서 생성·할당한다. 저장소에는 tenant ID, app IDs, group ID, deployment token을 커밋하지 않는다.
- 첫 릴리스 검증은 로그인 거부/허용, 저장 복구, 결과/랭킹 등록을 포함한다.

## Implementation

### I01. 운영자 설정 절차와 배포 명령
- Related Files:
  - `docs/deployment/entra-setup.md` :: workforce app registrations and role assignment; new
  - `docs/deployment/release-runbook.md` :: provision/link/deploy steps; new
  - `scripts/deploy-web.ps1` :: SWA deploy command; new
  - `scripts/deploy-api.ps1` :: Functions deployment command; new
- **Data & Schema Fields**: Entra web SPA registration: single-tenant, redirect URIs for local and SWA; API registration exposes `api://{apiClientId}/access_as_user`; app role `CaravanGame.Player` is assignable to users/groups; assign DEX employee security group. Function config receives tenant ID and API app ID URI. Deployment credentials live in CI secret store or Azure developer login, not files.
- **Execution Flow / Logic**: document provision → API deploy → link Function to SWA Standard → configure SPA redirect/scope → assign DEX group to role → set web build vars → deploy web → verify host/API. Scripts support an authenticated local Azure CLI flow; CI automation is not required for this first release.
- **Error & Exception Handling**: wrong tenant/audience or missing app role returns 401/403; deployment step aborts on failed Azure CLI command; no secret is printed by scripts; setup doc includes rollback of static frontend while preserving Cosmos data.

### I02. Release smoke verification
- Related Files:
  - `scripts/smoke-test.ps1` :: `Test-GameRelease` — endpoint flow checks; new
  - `docs/deployment/release-checklist.md` :: human verification record; new
  - `apps/api/test/release/authorization.test.ts` :: protected-route checks; new
- **Data & Schema Fields**: smoke inputs are supplied through environment: `GAME_BASE_URL`, `DEX_TEST_USER`, `NON_DEX_TEST_USER`; never store passwords/tokens. Checks do not submit production leaderboard scores unless `ALLOW_TEST_RUN_SUBMISSION=true` is explicitly set.
- **Execution Flow / Logic**: check health; verify unauthenticated protected API is 401; DEX test user can sign in and load profile; non-DEX account is rejected; create and reload a test save; submit a test run in a nonproduction environment; verify one top-ten entry or personal rank; delete test account data if a cleanup endpoint is enabled only outside production.
- **Error & Exception Handling**: each failed check reports endpoint and expected/actual status but masks bearer tokens and personal details; stop at first auth/config failure; preserve production data.

## Acceptance Criteria
- [x] Operator can configure Entra app and DEX group without secrets in source
- [x] Deployment/runbook covers SWA, linked Function, Cosmos managed identity, and app role
- [x] Release checklist verifies allow/deny, save/resume, rewards, and both ranking modes

## Validation
- `npm run test --workspace apps/api -- test/release/authorization.test.ts` — route access rules pass
- `pwsh -File scripts/smoke-test.ps1 -Mode Local` — local API/web auth and health checks pass with supplied test configuration
- `npm run build` — release artifacts compile

## Commit Message
```text
docs(release): add Entra setup and Azure smoke checklist

Plan: 2026-10-21-caravan-escort-game
Phase: P05-cloud-release
Task: T02-release-validation

- Document DEX app role assignment and safe deployment settings
- Add release checks for auth save results and leaderboards
```

## Progress
- [x] Implementation complete
- [x] Validation passed (API auth tests 6/6, full build, PowerShell smoke check against local mock)
- commit: 8a61241
