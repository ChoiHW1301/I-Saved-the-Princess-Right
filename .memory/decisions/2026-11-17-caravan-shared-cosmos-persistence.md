# Decisions: Caravan shared Cosmos persistence

- Date: 2026-11-17
- Status: Confirmed

## D01. Existing Cosmos account, isolated game database
- Use the existing `maze-rescue-ms-b7af62a9` Azure Cosmos DB for NoSQL account in `CR-Project-01/grill-me-edu`.
- Create only a new `caravan-game` database in that account. Do not change any existing database or container such as `deckbuilding-roguelike`, `fac-man`, or `maze-rescue`.
- The user confirmed an independently provisioned database with 400 RU/s shared across the three game containers. The account is provisioned-throughput, not serverless. Its account-level free-tier allowance may already be consumed by other databases; the new 400 RU/s may be billed.

## D02. Game containers and identity
- Create `profiles` and `saves` with `/userId` partition keys, and `leaderboards` with `/boardId` in `caravan-game`, matching existing API repositories.
- Point the existing `caravan-grill-api-e21002` Function to the shared account endpoint with managed identity. Scope the Cosmos DB Built-in Data Contributor SQL role to `/dbs/caravan-game` when supported. Keep Storage data roles on the existing Caravan-only `caravangstge21002` account.
- The current user has RG Contributor, but no Storage data-role assignments exist for the Function identity. A role-assignment administrator must grant the required Storage roles; do not use account keys.

## D03. Existing web and API hosting
- Reuse `caravan-grill-e21002` Static Web App and `caravan-grill-api-e21002` Function App. Keep the existing DEX Entra registrations and employee role gate.
- Persist profile, current run, and top-10 leaderboard through the existing API. Do not submit real employee gameplay data during verification; use a designated test account.

## D04. Deployment safety
- Use a standalone Bicep template referencing the shared Cosmos account as `existing`; do not rerun `infra/main.bicep`, which provisions a dedicated Cosmos account.
- Review What-If before creating only `caravan-game` and its three containers. Record the changed deployment path so future work does not accidentally recreate the deleted dedicated account.

## Code findings
- `apps/api/src/data/cosmosClient.ts` already targets `caravan-game`, and the three repository partition keys match the planned containers.
- API test `profile-save.test.ts` expects the ranked `warrior-thorn-armor` training to reject a second purchase; current game rules allow five ranks. Update that stale test before release.
