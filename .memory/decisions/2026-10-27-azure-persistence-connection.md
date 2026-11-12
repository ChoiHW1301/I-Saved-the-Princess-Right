# Decisions: Azure persistence and DEX sign-in connection

- Date: 2026-10-27
- Status: Superseded by [Caravan Game Azure Deployment to grill-me-edu](../plans/2026-10-27-caravan-grill-me-edu-deployment.md)

## D01. Azure target
- **Chosen**: Deploy a development environment to subscription `CR-Project-01` in a new resource group named `rg-caravan-game-dev`.
- **Region**: Keep the Static Web App, Functions API, Storage, and monitoring resources in `East Asia`. Place Cosmos DB in `Korea Central`.
- **Rationale**: The subscription allows Static Web Apps only in East Asia, but Cosmos DB account creation in East Asia failed due to regional capacity/access limits. Korea Central is enabled for Cosmos DB in this subscription, and is closer to the DEX users. The Bicep template now supports a separate Cosmos region.

## D02. Authentication and authorization
- **Chosen**: Use the existing single-tenant DEX Entra registrations `Caravan Escort Web` and `Caravan Escort API`; API delegated scope is `access_as_user`; users must have the `CaravanGame.Player` app role.
- **Status**: Admin consent was completed for the Web application's API permission. The DEX employee security group has been assigned the `CaravanGame.Player` role by the user.
- **Rationale**: Reuse the completed organization configuration instead of creating duplicate registrations.

## D03. Persistent game data
- **Chosen**: Azure Functions API + Cosmos DB managed identity. Persist player profile (gold, unlocks, upgrades), one current run per user (including manual and automatic save/resume), and score/clear leaderboards.
- **Rationale**: This matches the existing API contracts, repositories, and deployment template.

## D04. Deployment boundaries
- **Chosen**: Deploy development resources and use a dedicated DEX test account for sign-in and persistence checks. Do not submit real employee gameplay data or treat this environment as production.
- **Rationale**: The resource group is explicitly development-scoped, and browser authorization requires a real user interaction.

## D05. Resource naming
- **Chosen**: Use globally unique development names for Static Web Apps, Functions, Cosmos DB, and Storage, and store any local-only deployment parameters outside tracked files.
- **Rationale**: Azure resource names have global uniqueness constraints; tenant and application IDs are organization configuration and should not be written into tracked parameter files.
