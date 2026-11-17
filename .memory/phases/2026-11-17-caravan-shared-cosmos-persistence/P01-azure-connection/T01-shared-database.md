# Task: T01 Isolated database in shared Cosmos account

## Status: done

## Goal
Create `caravan-game` and only its three containers under the existing `maze-rescue-ms-b7af62a9` account without updating any other game resource.

## Decision Summary
- Existing account is in `CR-Project-01/grill-me-edu`, Korea Central, provisioned-throughput with free tier enabled. User chose an independent database with 400 RU/s manual shared throughput.
- Never deploy `infra/main.bicep` for this task; it declares a new Cosmos account.

## Implementation

### I01. Dedicated database-only Bicep
- Related Files:
  - `infra/shared-cosmos-game.bicep` :: `cosmosAccount`, `gameDatabase`, `profiles`, `saves`, `leaderboards` — new.
  - `infra/main.bicep` :: current partition-key declarations — read-only reference.
- **Signatures & Types**: `targetScope = 'resourceGroup'`; `param cosmosAccountName string`; `param cosmosDatabaseName string = 'caravan-game'`; `param sharedThroughput int = 400`. Reference `Microsoft.DocumentDB/databaseAccounts@2024-05-15` with `existing`; never declare account creation or changes.
- **Data & Schema Fields**: database `caravan-game`, manual shared `throughput: 400`; containers `profiles` and `saves` with partition `/userId`, `leaderboards` with `/boardId`, hash version 2.
- **Execution Flow / Logic**: Bicep creates a database under the existing account and three containers under that database. Output account endpoint, database ID, and database resource ID. Existing databases remain outside template scope.

### I02. Validate and provision
- Related Files:
  - `infra/shared-cosmos-game.bicep` — deployment source.
  - `docs/deployment/release-checklist.md` — record shared-account path if deployment instructions point to old dedicated template; modify only relevant section.
- Run Bicep compile and `az deployment group what-if` with resource group `grill-me-edu`, account `maze-rescue-ms-b7af62a9`, database `caravan-game`, throughput 400.
- Confirm only the new database and three containers are in the change set before `az deployment group create`; abort if another project resource appears.
- Verify database throughput is 400 and the three partition paths match. Do not write user data yet.

## Acceptance Criteria
- [x] Existing Cosmos account and its other databases are unchanged.
- [x] `caravan-game` has 400 RU/s shared throughput and the three expected partitioned containers.
- [x] Deployment template does not create a Cosmos account.

## Validation
- `az bicep build --file infra/shared-cosmos-game.bicep` — compile succeeds.
- `az deployment group what-if --resource-group grill-me-edu --template-file infra/shared-cosmos-game.bicep --parameters cosmosAccountName=maze-rescue-ms-b7af62a9` — only new game database/containers.
- `az cosmosdb sql database throughput show --resource-group grill-me-edu --account-name maze-rescue-ms-b7af62a9 --name caravan-game --query resource.throughput -o tsv` — 400.
- `az cosmosdb sql container list --resource-group grill-me-edu --account-name maze-rescue-ms-b7af62a9 --database-name caravan-game --query "[].{name:name,partition:resource.partitionKey.paths[0]}" -o table` — three expected paths.

## Commit Message
```text
ops(azure): provision isolated caravan database in shared cosmos

Plan: 2026-11-17-caravan-shared-cosmos-persistence
Phase: P01-azure-connection
Task: T01-shared-database

- Reference the existing Cosmos account without recreating it
- Create a separate 400 RU game database and three containers
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- Azure deployment: `caravan-shared-db-20261117` (`Succeeded`); What-If: 4 create, 59 ignore.
- commit: pending
