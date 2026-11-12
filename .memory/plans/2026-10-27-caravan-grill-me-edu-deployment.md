# Plan: Caravan Game Azure Deployment to grill-me-edu

## Goal
Deploy the React game to a new Free Azure Static Web App in the existing `grill-me-edu` group, backed by a dedicated Azure Functions API, Cosmos DB, and Storage account. Verify DEX sign-in and data persistence, then remove only the old Caravan game resources from `rg-caravan-game-dev` to end duplicate charges.

## Confirmed constraints
- Subscription: `CR-Project-01` (`b7af62a9-9a10-4deb-95fa-1690f7bbd33d`); tenant: `69c1e470-4528-435a-a1ae-de98e0aac738`.
- Target resource group already exists: `grill-me-edu` (metadata location `koreacentral`). Do not create/delete the group or modify its existing project resources.
- Use East Asia for Static Web Apps, Functions, Storage, and monitoring; Korea Central for Cosmos DB.
- Use a new Free Static Web App and direct API calls to the Function origin (`VITE_API_BASE_URL`). Function CORS must allow only that SWA production origin.
- Create game-specific Storage and Cosmos resources; do not reuse the existing `maze-rescue` or other project stores.
- Use Cosmos serverless, Storage Standard_LRS, Functions Flex Consumption, and 30-day Log Analytics retention.
- Reuse the existing DEX web/API app registrations and `CaravanGame.Player` role assignment; add the new SPA redirect URL while retaining localhost.
- Deploy as `hw.choi2@dexconsulting.net` with RG Contributor. A resource administrator assigns only the Function identity's required data roles after provisioning.
- Use the existing PowerShell scripts for manual deployment; no GitHub Actions in this phase.
- Keep old resources until live verification passes; then delete only Caravan game resources in `rg-caravan-game-dev` and remove its obsolete SPA redirect URI. The current user has no access to that old group, so its administrator must perform cleanup.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `paused` | Deployment is deferred by the user after provisioning; resume when requested and after a resource administrator assigns the Function data roles. | [P01](../phases/2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/phase.md) |

## Out of scope
- Production release, custom domain, private networking, CI/CD, changing gameplay/API contracts, deleting any existing `grill-me-edu` project resource, and removing the old resource group itself.
