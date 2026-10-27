# Current Context

## Active Plan
[Caravan Game Azure Deployment to grill-me-edu](./plans/2026-10-27-caravan-grill-me-edu-deployment.md)

## Active Phase
[P01 Static Site and Isolated API Stack](./phases/2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/phase.md)

## Active Task
[T02 Provision the Dedicated Game Stack](./phases/2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/T02-provision-grill-stack.md)

## Status
- The user selected `grill-me-edu` and confirmed Contributor access for `hw.choi2@dexconsulting.net` in `CR-Project-01`.
- Do not modify or delete existing resources in `grill-me-edu` other than adding isolated Caravan game resources.
- The previous `rg-caravan-game-dev` plan is superseded; retain its game resources until the new stack passes live verification, then request an administrator to delete only those game resources.
- Azure CLI is authenticated as `hw.choi2@dexconsulting.net` in the DEX tenant `69c1e470-4528-435a-a1ae-de98e0aac738`.
- Deployment architecture: Free Static Web App calling the dedicated Function API directly through `VITE_API_BASE_URL`; dedicated Cosmos serverless and Storage LRS; existing DEX app registrations.

## Next Step (IMPORTANT)
T01 is complete: the template now uses Free Static Web Apps with direct Function API calls and defers managed identity data-role grants. For T02, verify the signed-in subscription and group-level Contributor access, validate the template with fresh unique resource names, and review the full what-if before creating resources. Do not deploy if existing project resources would be changed.
