# Task: T03 Managed identity access and Functions release

## Status: pending

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
- [ ] Function has required Storage and Cosmos data roles, scoped to Caravan resources.
- [ ] Cosmos endpoint points at shared account and API handlers are indexed.
- [ ] Health and protected-route smoke checks pass.

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
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
