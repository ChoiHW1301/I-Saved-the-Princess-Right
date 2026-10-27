# Task: T01 Provision Azure Development Resources

## Status: done

## Execution Note (2026-10-27)
- Confirmed the active Azure CLI subscription is `CR-Project-01` and tenant is DEX.
- Attempted to create `rg-caravan-game-dev` in `eastasia`; Azure rejected the request with `AuthorizationFailed` for `Microsoft.Resources/subscriptions/resourcegroups/write` on the subscription.
- User logged in to `CR-Project-01` as an authorized account; creation of `rg-caravan-game-dev` succeeded.
- Bicep validation and what-if succeeded. What-if predicted 16 creates and one unsupported nested Cosmos SQL role-assignment prediction (cannot be computed until deployment).
- First deployment partially created Storage, Application Insights, Log Analytics, Flex plan, and Static Web App. Cosmos DB creation in East Asia failed with `ServiceUnavailable` due to regional capacity/access limits.
- Keep the succeeded resources in East Asia and pass `cosmosLocation=koreacentral`; `Microsoft.DocumentDB` lists Korea Central as a supported region for this subscription.
- The Korea Central Cosmos account and database were created on retry. Functions app creation failed because Flex Consumption rejects the legacy `FUNCTIONS_WORKER_RUNTIME` app setting; removed that setting from `infra/main.bicep` because `functionAppConfig.runtime` already declares Node 24.
- Redeployment succeeded using `cosmosLocation=koreacentral` and a new account name. The failed East Asia account `caravandb102790` remains in failed provisioning state; the successful account is `caravandb102791`.
- Successful outputs: Static Web App `black-sea-092d93e00.3.azurestaticapps.net`; Function app `caravan-api-dev-102790` / `caravan-api-dev-102790.azurewebsites.net`; Cosmos endpoint `https://caravandb102791.documents.azure.com:443/`.

## Goal
Create `rg-caravan-game-dev` in `CR-Project-01` and deploy the existing Bicep stack with unique development resource names, so the API and web app have a real Azure environment.

## Decision Summary
- Use subscription `b7af62a9-9a10-4deb-95fa-1690f7bbd33d`, resource region `eastasia`, Cosmos region `koreacentral`, tenant `69c1e470-4528-435a-a1ae-de98e0aac738`, API audience `c24b0058-31c5-4b44-8da0-36a6b9e68bbc`.
- Static Web Apps is available in East Asia in this subscription; Flex Consumption and Cosmos DB are also supported there. Use serverless Cosmos and do not add account keys or secrets.

## Implementation

### I01. Establish and validate the deployment target
- Related Files:
  - `infra/main.bicep` :: `staticWebApp`, `functionApp`, `cosmosAccount`, `profiles`, `saves`, `leaderboards` — existing resource graph; read-only.
  - `infra/main.bicepparam` :: current placeholder values — use as reference only; do not put tenant or app IDs in tracked files.
- Details:
  - Confirm `az account show` identifies `CR-Project-01` and tenant `69c1e470-4528-435a-a1ae-de98e0aac738`.
  - Create resource group `rg-caravan-game-dev` at `eastasia` with tags `application=caravan-escort-game`, `environment=dev`.
  - Derive four unique lowercase names from a short generated suffix: Static Web App and Function names allow lowercase letters/digits/hyphens; Cosmos and Storage names allow lowercase letters/digits only; Storage name must be at most 24 characters, Cosmos at most 44.
  - Pass Bicep parameters at deployment time: `location=eastasia`, `cosmosLocation=koreacentral`, `environmentName=dev`, `cosmosDatabaseName=caravan-game`, `entraTenantId=69c1e470-4528-435a-a1ae-de98e0aac738`, `entraApiAudience=c24b0058-31c5-4b44-8da0-36a6b9e68bbc`, `cosmosServerless=true`, `cosmosDatabaseThroughput=400` (ignored for serverless).
  - Do not set `FUNCTIONS_WORKER_RUNTIME` on Flex Consumption; use only the Node runtime configured under `functionAppConfig.runtime`.
  - Do not commit local parameter files, tokens, deployment keys, or access tokens.
- Execution Flow:
  1. Check resource name syntax and confirm target subscription before any deployment.
  2. Run Bicep validation and `az deployment group what-if` against the dev resource group.
  3. Deploy `infra/main.bicep` with the parameters above.
  4. Capture non-secret outputs: SWA hostname, Function hostname/name, Cosmos endpoint, Function principal ID. Do not output keys or tokens.

## Acceptance Criteria
- [x] Resource group exists in `CR-Project-01`; app resources use `eastasia` and Cosmos DB uses `koreacentral`.
- [x] Bicep deployment succeeds and outputs the Static Web App and Function hostnames.
- [x] Cosmos has `profiles`, `saves`, and `leaderboards` containers with the partition keys defined in Bicep.
- [x] Function has managed identity data access; storage and Cosmos local key authentication remain disabled as declared by Bicep.

## Validation
- `az account show --query "{name:name,tenant:tenantId,id:id}" -o json` — expected subscription and tenant match the values above.
- `az deployment group validate --resource-group rg-caravan-game-dev --template-file infra/main.bicep --parameters location=eastasia cosmosLocation=koreacentral environmentName=dev staticSiteName=<unique-swa> functionName=<unique-function> cosmosAccountName=<unique-cosmos> storageAccountName=<unique-storage> cosmosDatabaseName=caravan-game entraTenantId=69c1e470-4528-435a-a1ae-de98e0aac738 entraApiAudience=c24b0058-31c5-4b44-8da0-36a6b9e68bbc cosmosServerless=true cosmosDatabaseThroughput=400` — expected validation success.
- `az deployment group what-if --resource-group rg-caravan-game-dev --template-file infra/main.bicep --parameters ...` — expected only resources in the named dev group.
- `az deployment group create --resource-group rg-caravan-game-dev --name caravan-dev-<suffix> --template-file infra/main.bicep --parameters ...` — expected provisioning success.

## Commit Message
```text
ops(azure): provision development game resources

Plan: 2026-10-27-azure-persistence-connection
Phase: P01-dev-deployment
Task: T01-provision-resources

- Add the deployment decision and Azure resource plan
- Record the non-secret development resource outputs
```

## Progress
- [x] Implementation complete
- [x] Validation passed (`npm run test:infra`, Bicep validation, what-if, deployment)
- commit: pending
