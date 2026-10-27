# Plan: Azure Persistence and DEX Sign-in Connection

## Goal
Deploy the existing Azure Functions + Cosmos DB + Static Web Apps development stack to `CR-Project-01`, configure the existing DEX Entra apps, and verify authenticated profile, save/resume, and leaderboard API flows.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Provision Azure dev resources, deploy API and web client, then perform DEX-authenticated persistence checks. | [P01](../phases/2026-10-27-azure-persistence-connection/P01-dev-deployment/phase.md) |

## Confirmed constraints
- Subscription: `CR-Project-01` (`b7af62a9-9a10-4deb-95fa-1690f7bbd33d`)
- Resource group: `rg-caravan-game-dev`
- Static Web App/API/Storage/monitoring region: `eastasia` (Static Web Apps is available there in this subscription)
- Cosmos DB region: `koreacentral` (East Asia account creation failed due to current capacity/access limits)
- Entra tenant: `69c1e470-4528-435a-a1ae-de98e0aac738`
- API app/client ID: `c24b0058-31c5-4b44-8da0-36a6b9e68bbc`
- Web app: `Caravan Escort Web`; API app: `Caravan Escort API`; scope: `api://c24b0058-31c5-4b44-8da0-36a6b9e68bbc/access_as_user`
- User confirmed admin consent and assigned the DEX employee security group to `CaravanGame.Player`.
- All resources are development-only. Use a dedicated test account for live gameplay data.

## Out of scope
- Production release, DNS/custom domain, private networking, backup/restore policy, billing optimization, and production employee data.
- Changing gameplay/API contracts: current API already supports profile, current run save/resume, and score/clear leaderboards.
