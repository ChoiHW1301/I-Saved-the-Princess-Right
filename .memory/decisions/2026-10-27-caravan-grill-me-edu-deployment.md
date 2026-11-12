# Decisions: Caravan Game Azure Deployment to grill-me-edu

- Date: 2026-10-27
- Status: Confirmed

## D01. Deployment target
- **Chosen**: Deploy the new game stack to the existing `grill-me-edu` resource group in subscription `CR-Project-01` (`b7af62a9-9a10-4deb-95fa-1690f7bbd33d`). Do not create another resource group.
- **Rationale**: The user's `hw.choi2@dexconsulting.net` account has Contributor access to this group. Its existing resources belong to other projects and must not be changed or deleted by this plan.

## D02. Frontend and API hosting
- **Chosen**: Create a new Free Azure Static Web App for the React frontend and call the dedicated Azure Functions API directly using `VITE_API_BASE_URL`.
- **Rationale**: The web client already supports an API origin. Direct API calls avoid the paid Standard plan required to link an existing Function App to Static Web Apps. Configure Function CORS for only the new Static Web App origin.

## D03. Dedicated data resources
- **Chosen**: Create a new game-specific Storage account and Cosmos DB account/database. Use Storage Standard_LRS and Cosmos serverless. Place Static Web Apps, Functions, Storage, and monitoring in East Asia; place Cosmos DB in Korea Central.
- **Rationale**: Existing Cosmos and Storage resources in `grill-me-edu` belong to other named projects. Dedicated data resources avoid sharing game data or identity permissions. These regions match the subscription's available resources and the previous Cosmos capacity outcome.

## D04. Identity and application authorization
- **Chosen**: Reuse the existing single-tenant DEX Entra applications `Caravan Escort Web` and `Caravan Escort API`, the `access_as_user` delegated scope, and the existing `CaravanGame.Player` employee-group assignment. Add the new Static Web App URL to the web SPA redirect URI list, retaining localhost.
- **Rationale**: The existing consent and employee role setup should be reused; no duplicate app registrations or role grants are needed.

## D05. Deployment identity and managed identity permissions
- **Chosen**: Use `hw.choi2@dexconsulting.net` with Contributor at the `grill-me-edu` resource-group scope for resource deployment. After creating the Function system identity, have a resource administrator grant only the required Storage data roles and Cosmos SQL data role to that identity once.
- **Rationale**: Contributor can manage resources but cannot create Azure RBAC assignments. A one-time, narrowly scoped role grant avoids using an administrator account for normal deployment.

## D06. Deployment method
- **Chosen**: Deploy manually using the repository's PowerShell/Azure CLI scripts. Do not configure GitHub Actions in this phase.
- **Rationale**: This uses the existing deployment flow and avoids introducing CI secrets before the environment is verified.

## D07. Old development stack cleanup
- **Chosen**: Keep `rg-caravan-game-dev` until the new stack passes live sign-in and persistence verification. Then ask an administrator to delete only the Caravan game resources from that group. Retain the resource group itself unless its administrator confirms it contains no other assets and explicitly chooses to remove it. Remove the old Static Web App redirect URI after the new one is verified.
- **Rationale**: This preserves a rollback path during migration and removes duplicate game-specific costs afterward without touching unrelated resources.

## D08. Cost and safety boundaries
- **Chosen**: Use Free Static Web Apps, Flex Consumption Functions, serverless Cosmos DB, Standard_LRS Storage, and 30-day Log Analytics retention. Use incremental resource-group deployments and unique game-specific resource names. Never delete or repurpose existing `grill-me-edu` project resources.
- **Rationale**: This keeps idle/fixed costs lower where the selected architecture permits and makes the deployment what-if easy to review. A short overlap with the old game stack is accepted until verification succeeds.

## D09. User-reported Cosmos DB cleanup
- **Status (2026-11-12)**: The user confirmed that the previously added Caravan Cosmos DB was deleted.
- **Verification**: This is user-reported and was not independently checked in Azure. The exact account name and resource group were not recorded.
- **Boundary**: This records only the Caravan Cosmos DB the user intended to remove. It does not change D01/D03/D08: unrelated existing resources in `grill-me-edu` remain out of scope and must not be deleted or repurposed.
