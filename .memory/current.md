# Current Context

## Active Plan
[Caravan Game Azure Deployment to grill-me-edu](./plans/2026-10-27-caravan-grill-me-edu-deployment.md)

## Active Phase
[P01 Static Site and Isolated API Stack](./phases/2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/phase.md)

## Active Task
[T03 Assign Runtime Data Roles and Deploy API](./phases/2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/T03-deploy-api.md)

## Status
- The user selected `grill-me-edu` and confirmed Contributor access for `hw.choi2@dexconsulting.net` in `CR-Project-01`.
- Do not modify or delete existing resources in `grill-me-edu` other than adding isolated Caravan game resources.
- The previous `rg-caravan-game-dev` plan is superseded; retain its game resources until the new stack passes live verification, then request an administrator to delete only those game resources.
- Azure CLI is authenticated as `hw.choi2@dexconsulting.net` in the DEX tenant `69c1e470-4528-435a-a1ae-de98e0aac738`.
- Deployment architecture: Free Static Web App calling the dedicated Function API directly through `VITE_API_BASE_URL`; dedicated Cosmos serverless and Storage LRS; existing DEX app registrations.

## Next Step (IMPORTANT)
T02 is complete: the Free Static Web App, Function Flex app, serverless Cosmos DB, Storage, and monitoring were created in `grill-me-edu`; only newly named Caravan resources were added. For T03, use Function principal ID `1b48f7e1-1b39-498d-8958-61f1d946db7e` to grant the documented minimum runtime data roles, then deploy and verify the API package. Storage/Cosmos access-role assignment must be performed by an administrator or an authorized role administrator because the current Contributor access is insufficient.
