# Task: T02 Provision the Dedicated Game Stack

## Status: done

## Goal
Provision a new Caravan game stack inside `grill-me-edu` using the signed-in user's Contributor access, without modifying any existing project resource.

## Decision Summary
- Use the existing `grill-me-edu` group; do not create a group and do not deploy with `--mode Complete`.
- Use fresh globally unique names and East Asia for app services/storage/monitoring; use Korea Central for the serverless Cosmos account.

## Implementation

### I01. Validate the target, names, and deployment diff
- Related Files:
  - `infra/main.bicep` :: resource declarations — execute as template.
  - `infra/main.bicepparam` or ignored local parameter file — create only if needed; do not commit tenant or application IDs.
- Details:
  - Confirm `az account show` returns user `hw.choi2@dexconsulting.net`, subscription ID `b7af62a9-9a10-4deb-95fa-1690f7bbd33d`, and tenant `69c1e470-4528-435a-a1ae-de98e0aac738`.
  - Confirm `az group show --name grill-me-edu` succeeds and `az role assignment list` shows Contributor at this group scope.
  - Generate fresh names for the Static Web App, Function app, Cosmos account, and Storage account. Avoid names used by the previous group (`caravan-game-102790`, `caravan-api-dev-102790`, `caravandb102790`, `caravandb102791`, `caravanstg102790`) and any resource in the target group. Observe the SWA/Function lowercase-hyphen naming rules, Storage 24-character lowercase alphanumeric limit, and Cosmos 44-character lowercase alphanumeric limit.
  - Pass `location=eastasia`, `cosmosLocation=koreacentral`, `environmentName=dev`, `cosmosDatabaseName=caravan-game`, existing tenant/API audience IDs, `cosmosServerless=true`, and `cosmosDatabaseThroughput=400` (ignored for serverless).
  - Use the existing API audience `c24b0058-31c5-4b44-8da0-36a6b9e68bbc`; do not make it a secret.
  - Run Bicep validate and what-if against `grill-me-edu`. Review the full proposed resource list. Stop if any existing SWA, Storage, Cosmos, or other project resource is shown for replacement/deletion/update.

### I02. Deploy and capture non-secret outputs
- Related Files:
  - `infra/main.bicep` :: `staticWebApp`, `functionApp`, `cosmosAccount`, `storage`, `profiles`, `saves`, `leaderboards` — deploy.
- Details:
  - Run `az deployment group create` with a unique deployment name, `--resource-group grill-me-edu`, the exact parameters validated in I01, and incremental mode (the default).
  - Record only SWA hostname, Function hostname/name, Cosmos endpoint, Storage name, and Function principal ID. Never print Storage keys, Cosmos keys, SWA tokens, or bearer tokens.
  - Confirm created resources have tags `application=caravan-escort-game` and `environment=dev` so the later cleanup can identify them.
  - Do not remove the previous RG yet; T06 handles cleanup only after T05 passes.

### Provisioned resources (2026-10-27)
- Deployment: `caravan-grill-dev-e21002` — succeeded in subscription `CR-Project-01`, resource group `grill-me-edu`.
- Static Web App: `caravan-grill-e21002` — Free, East Asia, `https://calm-hill-0358c1a00.6.azurestaticapps.net`.
- Function App: `caravan-grill-api-e21002` — Flex Consumption FC1, East Asia, `https://caravan-grill-api-e21002.azurewebsites.net`.
- Function system-assigned identity principal ID: `1b48f7e1-1b39-498d-8958-61f1d946db7e`.
- Cosmos DB: `caravangrille21002` — serverless, Korea Central, endpoint `https://caravangrille21002.documents.azure.com:443/`.
- Storage: `caravangstge21002` — Standard LRS, East Asia; shared key access disabled.
- Monitoring: `appi-dev-mrsrvnk5pxr34` and `law-dev-mrsrvnk5pxr34` — East Asia.
- Verified containers: `profiles` (`/userId`), `saves` (`/userId`), `leaderboards` (`/boardId`).
- Function CORS allows only the Static Web App production hostname; credentials are disabled.
- The what-if proposed 12 resource creations and ignored 11 existing resources; it proposed no update or deletion of existing assets.
- Managed identity data-role assignments remain deferred to T03. No access keys or deployment tokens were captured.

## Acceptance Criteria
- [x] Deployment succeeds using `hw.choi2@dexconsulting.net` in `grill-me-edu`.
- [x] What-if contained only new Caravan-prefixed resource creation; existing group assets are unchanged.
- [x] Cosmos contains `profiles`, `saves`, and `leaderboards` containers with `/userId`, `/userId`, and `/boardId` partition keys.
- [x] SWA, Function, Storage, and monitoring are in East Asia; Cosmos is in Korea Central.

## Validation
- `az account show --query "{user:user.name,subscription:name,id:id,tenant:tenantId}" -o json` — expected user/subscription/tenant match.
- `az deployment group validate --resource-group grill-me-edu --template-file infra/main.bicep --parameters location=eastasia cosmosLocation=koreacentral environmentName=dev staticSiteName=<new-swa> functionName=<new-function> cosmosAccountName=<new-cosmos> storageAccountName=<new-storage> cosmosDatabaseName=caravan-game entraTenantId=69c1e470-4528-435a-a1ae-de98e0aac738 entraApiAudience=c24b0058-31c5-4b44-8da0-36a6b9e68bbc cosmosServerless=true cosmosDatabaseThroughput=400` — expected success.
- `az deployment group what-if --resource-group grill-me-edu --template-file infra/main.bicep --parameters ...` — manually confirm only new tagged game resources are added.
- `az deployment group create --resource-group grill-me-edu --name caravan-grill-dev-<suffix> --template-file infra/main.bicep --parameters ...` — expected success.

## Commit Message
```text
ops(azure): provision game stack in grill-me-edu

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T02-provision-grill-stack

- Provision isolated game resources without touching existing projects
- Record non-secret resource outputs for API and web deployment
```

## Progress
- [x] Implementation complete
- [x] Validation passed: account and Contributor scope verified; ARM validation and what-if succeeded; deployment succeeded; resource SKU, location, CORS, tags, and Cosmos partition keys verified.
- commit: recorded in Git history
