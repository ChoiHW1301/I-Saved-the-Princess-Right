# Task: T03 Managed identity access and Functions release

## Status: done

## Goal
Connect the existing Function to the shared Cosmos database using managed identity, deploy the API, and verify its public and protected endpoints.

## Decision Summary
- Function `caravan-grill-api-e21002` has a system-assigned identity. Its host/deployment Storage is the dedicated `caravangstge21002` account, not any other project's Storage.
- RG Contributor cannot assign Azure Storage RBAC roles. A resource administrator must grant only the needed data roles at the dedicated Storage scope.

## Implementation

### I01. Scoped roles and endpoint
- Related Files:
  - `apps/api/src/data/cosmosClient.ts` :: `DATABASE_ID`, `getGameContainers` — read-only (`caravan-game`, `profiles`, `saves`, `leaderboards`).
  - `apps/api/src/config/env.ts` :: `COSMOS_ENDPOINT` — read-only.
  - `docs/deployment/release-checklist.md` — record role scope and checks; modify.
- **Signatures & Types**: `COSMOS_ENDPOINT` is the public HTTPS endpoint of `maze-rescue-ms-b7af62a9`. The Function principal ID comes from `az functionapp identity show`, not a personal user.
- **Data & Schema Fields**: Cosmos SQL data role built-in Data Contributor ID `00000000-0000-0000-0000-000000000002`, scope `/dbs/caravan-game`; Storage roles at `caravangstge21002` scope: Blob Data Owner, Queue Data Contributor, Table Data Contributor.
- **Execution Flow / Logic**: verify/assign Cosmos data role to Function identity; have an administrator create missing Storage RBAC assignments if current identity lacks roleAssignments/write. Point Function `COSMOS_ENDPOINT` at shared account. Do not change account keys, other databases, or other projects' roles.

### I02. Deploy and smoke-test
- Related Files:
  - `scripts/deploy-api.ps1` :: zip deployment — execute.
  - `scripts/smoke-test.ps1` :: release health and anonymous-auth checks — execute.
  - `apps/api/src/functions/index.ts` :: handler registration — read-only.
- Deploy the API package once Storage roles have propagated. Verify `az functionapp function list` indexes health, profile, save, runs, leaderboards. Health returns 200; anonymous protected requests return 401. Do not print bearer tokens or app-setting values that may contain secrets.

## Acceptance Criteria
- [x] Function has required Storage and Cosmos data roles, scoped to Caravan resources.
- [x] Cosmos endpoint points at shared account and API handlers are indexed.
- [x] Health and protected-route smoke checks pass.

## Validation
- `az functionapp function list --resource-group grill-me-edu --name caravan-grill-api-e21002 -o table` — expected handlers.
- `./scripts/deploy-api.ps1 -ResourceGroup grill-me-edu -FunctionAppName caravan-grill-api-e21002` — success.
- `$env:GAME_BASE_URL='https://caravan-grill-api-e21002.azurewebsites.net'; ./scripts/smoke-test.ps1 -Mode Release` — health 200, protected 401.

## Commit Message
```text
ops(azure): connect caravan API to shared cosmos database

Plan: 2026-11-17-caravan-shared-cosmos-persistence
Phase: P01-azure-connection
Task: T03-api-deployment

- Scope Cosmos access to the caravan-game database
- Deploy and verify the existing Functions API
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- 2026-11-17: Created the Function system identity's Cosmos DB Built-in Data Contributor assignment scoped to `/dbs/caravan-game` in `maze-rescue-ms-b7af62a9`.
- 2026-11-17: Updated the Function's `COSMOS_ENDPOINT` app setting to the shared account endpoint. The API deployment has not started.
- 2026-11-17: Storage role assignment attempted as `hw.choi2@dexconsulting.net` and rejected by Azure with `AuthorizationFailed` for `Microsoft.Authorization/roleAssignments/write`. The three roles must be granted by an account with role-assignment authority, scoped to `caravangstge21002`; do not grant them at the resource-group or subscription scope.
- 2026-11-17: Microsoft Graph read of the Web registration also requires a refreshed MFA session; this does not block the Storage role assignment but will matter before the web release.
- 2026-11-17: Verified the administrator's three Storage data-role assignments on `caravangstge21002` for Function principal `1b48f7e1-1b39-498d-8958-61f1d946db7e`; verified Cosmos data role at `/dbs/caravan-game` and the shared Cosmos endpoint host.
- 2026-11-17: `./scripts/deploy-api.ps1 -ResourceGroup grill-me-edu -FunctionAppName caravan-grill-api-e21002` completed. Azure indexed 12 functions. Release smoke checks passed: health 200; unauthenticated `/api/me`, `/api/profile`, `/api/save`, and both leaderboard routes 401. No game data was written.
- commit: pending
