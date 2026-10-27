# Task: T02 Deploy and Verify Azure API

## Status: pending

## Goal
Deploy the built Azure Functions package into the provisioned Flex Consumption app and verify health and anonymous access boundaries before browser sign-in.

## Decision Summary
- Use the existing `scripts/deploy-api.ps1` packaging/deployment flow and the Function system identity for Cosmos and host storage.
- Never set Cosmos keys, Storage keys, app secrets, or bearer tokens in source control or command output.

## Implementation

### I01. Deploy API package
- Related Files:
  - `scripts/deploy-api.ps1` :: packaging and `az functionapp deployment source config-zip` — execute; no source changes planned.
  - `apps/api/src/functions/health.ts` :: health endpoint — read-only.
  - `apps/api/src/auth/entra.ts` :: token/role checks — read-only.
- Details:
  - Invoke from repository root: `./scripts/deploy-api.ps1 -ResourceGroup rg-caravan-game-dev -FunctionAppName <T01-output-function-name>`.
  - Verify Function application settings contain tenant, API audience, Cosmos endpoint, and Application Insights connection string; do not print secrets.
  - Verify managed identity role assignments exist for Cosmos SQL data and Storage Blob/Queue/Table roles.

### I02. Verify health and auth boundary
- Related Files:
  - `scripts/smoke-test.ps1` :: release mode health and unauthenticated API checks — execute.
- Details:
  - Set `GAME_BASE_URL` to the Function origin for the first endpoint check.
  - Expect `GET /api/health` to return 200 and unauthenticated `GET /api/profile`, `/api/save`, and leaderboard requests to return 401.

## Acceptance Criteria
- [ ] Deployment script completes successfully.
- [ ] Health endpoint returns HTTP 200.
- [ ] Protected routes reject anonymous requests with HTTP 401.
- [ ] Function identity can access Cosmos containers without account keys.

## Validation
- `./scripts/deploy-api.ps1 -ResourceGroup rg-caravan-game-dev -FunctionAppName <function-name>` — expected successful zip deployment.
- `$env:GAME_BASE_URL='https://<function-host>'; ./scripts/smoke-test.ps1 -Mode Release` — expected health/auth smoke test pass.

## Commit Message
```text
ops(azure): deploy and verify game API

Plan: 2026-10-27-azure-persistence-connection
Phase: P01-dev-deployment
Task: T02-deploy-api

- Deploy Azure Functions API package
- Verify health and anonymous authorization boundaries
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
