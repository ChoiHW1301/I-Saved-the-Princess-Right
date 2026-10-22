# Azure release runbook

## Before the first release

1. Confirm the target subscription and resource group with `az account show`; select the intended subscription with `az account set` if needed.
2. Create the two single-tenant Entra registrations and assign the DEX employee group as described in [Entra setup](./entra-setup.md).
3. Review `infra/main.bicepparam` and provide unique names and the correct tenant/API audience through an environment-specific parameter file. Keep production parameters out of source control if they contain organization-specific identifiers.
4. Provision the Bicep resources with `az deployment group create`. The template creates a Standard Static Web App linked to a Flex Consumption Function, Cosmos DB, Application Insights, and managed identity role assignments. Confirm the Function identity can access Cosmos data before routing players to the site.
5. Confirm production Function settings include `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `COSMOS_ENDPOINT`, and `APPLICATIONINSIGHTS_CONNECTION_STRING`. The Function uses managed identity for Cosmos and AzureWebJobsStorage; do not add account keys.

## Deploy API

From the repository root, run `./scripts/deploy-api.ps1 -ResourceGroup <resource-group> -FunctionAppName <function-app>`. The script builds the contracts and API workspaces, creates a temporary deployable package, and deploys it through the authenticated Azure CLI session. It removes the temporary package on completion. Check the Function deployment result and `https://<function-host>/api/health` before proceeding.

## Link and configure the Static Web App

The Bicep template links the Function as the Static Web App backend. Confirm the linked backend is enabled and the Static Web App is Standard tier. The web client calls `/api/...` on the same origin when `VITE_API_BASE_URL` is empty.

Add the deployed Static Web App root URL to the SPA registration's redirect URIs. Configure `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_WEB_CLIENT_ID`, and `VITE_ENTRA_API_SCOPE` in the deployment environment, then deploy with `./scripts/deploy-web.ps1 -ResourceGroup <resource-group> -StaticSiteName <static-site>`. The script obtains the SWA deployment token from the authenticated Azure CLI session in memory and does not print it. It requires the Static Web Apps CLI (`swa`) on PATH.

If using a separate API origin, set `VITE_API_BASE_URL` to the Function origin (without `/api`) and configure the Function CORS allowlist for the exact Static Web App origin. Prefer the linked backend to avoid cross-origin configuration.

## Verify and roll back

Run the non-mutating checks in [release checklist](./release-checklist.md) and `./scripts/smoke-test.ps1 -Mode Release` with `GAME_BASE_URL` set. Complete DEX and non-DEX sign-in checks in a browser using dedicated test accounts. Only submit a test run against a nonproduction environment, after explicitly setting `ALLOW_TEST_RUN_SUBMISSION=true` and confirming that the test account is isolated from production.

For a frontend rollback, deploy the previously approved web build through the same SWA release process. For an API rollback, redeploy the previously approved Function package. Preserve Cosmos data: do not recreate or delete the database as part of rollback. Record the deployment version, operator, time, and checklist outcome in the release record.
