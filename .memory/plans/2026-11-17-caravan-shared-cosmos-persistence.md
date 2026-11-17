# Plan: Caravan shared Cosmos persistence

## Goal
Connect the existing Caravan web and Functions stack to an isolated `caravan-game` database in the existing shared Cosmos account, then verify profile, run-save, and leaderboard persistence.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Shared database, API release, web release, live verification | [P01](../phases/2026-11-17-caravan-shared-cosmos-persistence/P01-azure-connection/phase.md) |

## Execution Order
1. T01 create only the dedicated database and its three containers with 400 RU/s shared throughput.
2. T02 align the API training test with the current ranked rule and confirm build/package readiness.
3. T03 grant scoped data access, configure and deploy the API, then smoke-test it.
4. T04 configure the SPA and deploy the web app; verify sign-in and profile/save/leaderboard round trips.

## Boundaries
- `infra/main.bicep` provisions a separate Cosmos account and must not be rerun for this connection.
- `caravangstge21002` remains the Function's host/deployment storage; other projects' storage and Cosmos databases stay untouched.
- T03 requires a resource administrator to grant Storage data roles if the current Contributor cannot do so. The work up to that boundary can proceed independently.
