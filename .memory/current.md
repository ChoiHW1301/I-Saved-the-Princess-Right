# Current Context

## Active Plan
[Azure Persistence and DEX Sign-in Connection](./plans/2026-10-27-azure-persistence-connection.md)

## Active Phase
[P01 Development Azure Deployment](./phases/2026-10-27-azure-persistence-connection/P01-dev-deployment/phase.md)

## Active Task
[T02 Deploy and Verify Azure API](./phases/2026-10-27-azure-persistence-connection/P01-dev-deployment/T02-deploy-api.md)

## Status
- T01 is complete: `rg-caravan-game-dev` is provisioned; app infrastructure is in East Asia and Cosmos DB is in Korea Central. The user completed the DEX employee group assignment to `CaravanGame.Player`.
- Azure CLI is authenticated to `CR-Project-01` in DEX tenant `69c1e470-4528-435a-a1ae-de98e0aac738`.
- First deployment's failed East Asia Cosmos account `caravandb102790` remains in failed state; successful database account is `caravandb102791`.
- Public endpoints: Static Web App `https://black-sea-092d93e00.3.azurestaticapps.net`; Function `https://caravan-api-dev-102790.azurewebsites.net`.

## Next Step (IMPORTANT)
Read T02, deploy the API package into `caravan-api-dev-102790`, and verify `/api/health` and unauthenticated protected routes.
