# Task: T03 Grant Runtime Data Access and Deploy the API

## Status: in_progress

## Goal
Grant the new Function system identity only the data access it needs, deploy the Node API, and verify the public health/protected route boundary.

## Decision Summary
- The user deploys as RG Contributor. A resource administrator performs the one-time, resource-scoped identity role assignments after T02 creates the Function identity.
- Use managed identity only; never add Storage/Cosmos account keys.

## Implementation

### I01. Assign the Function identity its data roles
- Related Files:
  - `infra/main.bicep` :: `functionApp.identity.principalId`, `storage`, and `cosmosAccount` outputs — read-only.
  - `infra/modules/roleAssignments.bicep` :: `dataRole` — reference for the Cosmos SQL built-in role definition.
- Details:
  - Give the administrator the T02 Function principal ID, exact Storage resource ID, and exact Cosmos account/database ID through an approved channel.
  - At the Storage account scope, assign only `Storage Blob Data Owner`, `Storage Queue Data Contributor`, and `Storage Table Data Contributor` to the Function managed identity. Do not assign these roles at subscription or resource-group scope.
  - At the Cosmos account/database data scope, assign the Cosmos DB Built-in Data Contributor SQL role (`00000000-0000-0000-0000-000000000002`) to the same principal. Scope it to the `caravan-game` database where the Azure interface supports it; otherwise use the dedicated game Cosmos account scope.
  - Do not add the user's personal identity as a data-plane principal; this role is for the Function app's system identity.

### I02. Correct the Node v4 entry point and deploy
- Related Files:
  - `apps/api/package.json` :: `main` — set to `dist/src/functions/index.js`.
  - `apps/api/src/functions/index.ts` :: imports and registration of health, whoami, profile, save, runs, and leaderboards — read-only.
  - `scripts/deploy-api.ps1` :: package and `config-zip` deployment — execute; adjust only if validation demonstrates a packaging issue.
- Details:
  - Build contracts and API, package the `dist` tree and local contracts dependency, then run `scripts/deploy-api.ps1` with `ResourceGroup=grill-me-edu` and the T02 Function name.
  - Verify `az functionapp function list` returns all registered HTTP functions; the previous glob entry point returned zero matches in the hosted runtime.
  - Confirm app settings include `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `COSMOS_ENDPOINT`, `APPLICATIONINSIGHTS_CONNECTION_STRING`, `AzureWebJobsStorage__accountName`, and `AzureWebJobsStorage__credential=managedidentity`. Do not print values that are secrets.
  - Verify Function CORS contains only the new production SWA hostname.

### I03. Verify API behavior
- Related Files:
  - `apps/api/src/functions/health.ts` :: `/api/health` — read-only.
  - `apps/api/src/auth/authorize.ts` :: Entra token and role verification — read-only.
  - `scripts/smoke-test.ps1` :: Release smoke checks — execute.
- Details:
  - Set `GAME_BASE_URL` to the direct Function origin and run release smoke checks.
  - Expect health to return 200. Expect profile/save/leaderboard protected routes without a bearer token to return 401. Confirm Cosmos access succeeds without account keys.

## Acceptance Criteria
- [ ] Function managed identity has only the required Storage and Cosmos data roles.
- [ ] Function host indexes all expected API handlers; no `0 functions loaded` startup trace remains.
- [ ] `/api/health` returns 200 and protected routes reject unauthenticated requests with 401.
- [ ] No account key or access token is stored in source, parameter files, or logs.

## Validation
- `npm run build --workspace @caravan/contracts; npm run build --workspace @caravan/api` — expected success.
- `./scripts/deploy-api.ps1 -ResourceGroup grill-me-edu -FunctionAppName <new-function>` — expected package deployment success.
- `az functionapp function list --resource-group grill-me-edu --name <new-function> -o table` — expected all API functions listed.
- `$env:GAME_BASE_URL='https://<function-host>'; ./scripts/smoke-test.ps1 -Mode Release` — expected health and anonymous-auth checks pass.

## Commit Message
```text
ops(azure): deploy API with managed identity

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T03-deploy-api

- Use the Node Functions entry module for runtime indexing
- Verify keyless storage and Cosmos access
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
