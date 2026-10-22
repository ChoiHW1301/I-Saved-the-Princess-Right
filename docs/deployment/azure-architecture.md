# Azure deployment architecture

## Resources

`infra/main.bicep` deploys into an existing resource group. It creates an Azure Static Web Apps Standard site, a Linux Azure Functions Flex Consumption app, a storage account used by the Functions host and package deployment, a workspace-based Application Insights instance, a Log Analytics workspace, and a Cosmos DB for NoSQL account with the `caravan-game` database.

The containers match the API repositories: `profiles` and `saves` use `/userId`; `leaderboards` uses `/boardId`. The profile container stores both profile and run receipt documents. Cosmos local/key authentication is disabled. The Function app uses its system-assigned managed identity for Cosmos data access, deployment packages, and host storage. No Cosmos key or Function secret is parameterized. The template currently assigns Cosmos DB Built-in Data Contributor at the account scope because the API uses all three game containers; review a narrower per-database assignment if future APIs need less access. Cosmos defaults to serverless for intermittent internal traffic; pass `cosmosServerless=false` to enable a shared database throughput of `cosmosDatabaseThroughput` RU/s. Serverless is single-region, billed per request, and doesn't guarantee throughput or latency, so confirm this mode matches expected staff concurrency before a production deployment.

The Static Web App is Standard because it links the separately deployed Function app as a bring-your-own backend. The link makes `/api/*` available on the site origin. The API host also keeps the `/api` route prefix. `apps/web/staticwebapp.config.json` provides SPA fallback and browser security headers.

## Deploy infrastructure

Install Azure CLI with the Bicep extension, sign in, select the target subscription, and create the resource group separately. Choose globally unique lowercase names for the Static Web App, Function app, Cosmos account, and storage account. The committed parameter file uses names ending in `change-me` as placeholders and is not deployable without overrides.

```powershell
az login
az account set --subscription <subscription-id>
az group create --name <resource-group> --location koreacentral
az deployment group what-if --resource-group <resource-group> --parameters infra/main.bicepparam --parameters staticSiteName=<unique-swa-name> functionName=<unique-function-name> cosmosAccountName=<unique-cosmos-name> storageAccountName=<unique-storage-name> entraTenantId=<dex-tenant-guid> entraApiAudience=<api-client-guid>
az deployment group create --resource-group <resource-group> --name caravan-escort-dev --parameters infra/main.bicepparam --parameters staticSiteName=<unique-swa-name> functionName=<unique-function-name> cosmosAccountName=<unique-cosmos-name> storageAccountName=<unique-storage-name> entraTenantId=<dex-tenant-guid> entraApiAudience=<api-client-guid>
```

The template uses incremental resource group deployments. Review `what-if` before creation, especially if reusing names that already exist. Region availability and organization policy can prevent creation of a selected SKU or runtime. Replace the placeholder tenant and API audience GUIDs in the sample parameter file or pass the real public IDs as shown above.

## Build and deploy the apps

Build the monorepo from its root with `npm ci` followed by `npm run build`. Deploy the web artifact from `apps/web/dist` to the Static Web App. For a linked Function backend, keep the SWA workflow `api_location` empty; the backend has its own deployment. Build and publish `apps/api` separately using Azure Functions Core Tools or the organization's release pipeline. Publish the compiled `apps/api/dist` package and dependencies in a Functions-compatible ZIP package.

The Bicep deployment links the Functions resource to the Static Web App after both resources are created. The SWA backend link is not available to pull request preview environments. Deploy the site before testing `/api` because the SWA BYO backend route becomes available after a site deployment.

## Configuration boundaries

| Setting | Where it belongs | Notes |
| --- | --- | --- |
| `VITE_ENTRA_TENANT_ID` | Static Web App build environment | Public tenant identifier embedded in the web bundle. |
| `VITE_ENTRA_WEB_CLIENT_ID` | Static Web App build environment | Public SPA application ID. |
| `VITE_ENTRA_API_SCOPE` | Static Web App build environment | Exposed API delegated scope requested by MSAL. |
| `VITE_API_BASE_URL` | Static Web App build environment | Optional API origin without `/api`; leave empty for same-origin SWA proxy. Direct cross-origin calls also need the Function CORS allowlist configured. |
| `ENTRA_TENANT_ID` | Function App setting | Must match the DEX workforce tenant. |
| `ENTRA_API_AUDIENCE` | Function App setting | API application client ID expected in access-token `aud`. |
| `COSMOS_ENDPOINT` | Function App setting | Cosmos account endpoint. Function access uses managed identity. |
| `APPLICATIONINSIGHTS_CONNECTION_STRING` | Function App setting | Configured by Bicep for telemetry. |
| `AzureWebJobsStorage__accountName` | Function App setting | Host storage account name; access is granted with storage data roles. |

`VITE_*` values are not secrets. Never put client secrets, Cosmos keys, access tokens, or storage keys in browser build variables or committed parameter files. `.env.example` is a name/reference file and is not automatically loaded by the web workspace. For local Functions Core Tools, copy the API-only values into the ignored `apps/api/local.settings.json` using the existing `apps/api/local.settings.example.json` shape.

## Local and production validation

Run `az bicep build --file infra/main.bicep`, `npm run build`, and `npm run test:infra` before deploying. `npm run test:infra` only checks the template, settings boundaries, and route configuration; it does not create Azure resources. Function initialization rejects missing Entra or Cosmos settings with the specific setting name. Bicep sets `NODE_ENV=production`; the Function also requires an Application Insights connection string and HTTPS Cosmos endpoint in that mode.
