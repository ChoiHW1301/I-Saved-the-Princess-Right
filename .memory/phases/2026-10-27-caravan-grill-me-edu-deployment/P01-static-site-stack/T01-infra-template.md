# Task: T01 Adapt Infrastructure for Free Static Web Apps

## Status: done

## Goal
Make the existing Bicep stack deploy a dedicated React Static Web App and Function API without linked-backend Standard-plan requirements or Azure RBAC role assignments that exceed the user's Contributor access.

## Decision Summary
- Create a Free Static Web App and call the Function app directly with `VITE_API_BASE_URL`; restrict Function CORS to the new SWA production origin.
- Preserve managed identity, Cosmos serverless, disabled local auth, Storage LRS, and incremental deployments; grant runtime data roles after provisioning.

## Implementation

### I01. Update the Bicep resource graph
- Related Files:
  - `infra/main.bicep` :: `staticWebApp`, `functionApp`, `cosmosAccount`, `storage`, `linkedBackend`, `functionAuthSettings`, `storageBlobRole`, `storageQueueRole`, `storageTableRole`, `cosmosRole` ??modify/remove.
  - `infra/modules/roleAssignments.bicep` :: `dataRole` ??retain only if needed by the administrator's separately executed Cosmos data-role assignment; do not include it in the Contributor deployment.
- Details:
  - Keep `targetScope = 'resourceGroup'`; deployment targets the already-existing `grill-me-edu` group and remains incremental.
  - Change `staticWebApp.sku` from `Standard` to `Free`.
  - Remove `Microsoft.Web/staticSites/linkedBackends` and the linked-backend-specific `authsettingsV2` resource.
  - Remove all Storage `Microsoft.Authorization/roleAssignments` resources and the Cosmos SQL role assignment module from the normal Bicep deployment. Document their one-time post-provisioning assignment in T03.
  - Configure the Function app CORS allowed origins to exactly `https://${staticWebApp.properties.defaultHostname}` and leave credentials disabled. Do not add wildcard origins.
  - Keep Function runtime Node 24, Flex Consumption, system-assigned identity, `AzureWebJobsStorage__credential=managedidentity`, Cosmos endpoint app setting, and Application Insights connection string.
  - Keep Storage `allowSharedKeyAccess: false`, `defaultToOAuthAuthentication: true`, and `Standard_LRS`; keep Cosmos `disableLocalAuth: true`, `EnableServerless`, and `koreacentral` location supplied as a parameter.

### I02. Align infrastructure assertions and deployment configuration
- Related Files:
  - `infra/test/infra.test.ps1` :: expected template assertions ??modify.
  - `apps/web/src/auth/apiUrl.ts` :: `apiUrl` ??read-only; it already prefixes requests with `VITE_API_BASE_URL` and `/api`.
  - `apps/web/public/staticwebapp.config.json` :: SPA fallback ??read-only; retain `/api/*` exclusion.
- Details:
  - Assert SWA Free SKU, exact Function CORS origin expression, managed identity configuration, keyless Storage/Cosmos settings, Cosmos containers and partition keys, and absence of linked backend and role-assignment resources in the user deployment template.
  - Preserve the SPA navigation fallback to `/index.html` and exclusion of `/api/*`.
  - Do not put tenant IDs, resource names, credentials, or deployment tokens into committed parameter files. Pass non-secret identifiers at deployment time or use an ignored local parameter file.

## Acceptance Criteria
- [x] Bicep provisions Free Static Web Apps, Functions Flex, Cosmos serverless, Storage LRS, and monitoring without linking the Function backend.
- [x] CORS allows only the new SWA origin; no wildcard is present.
- [x] The user's ordinary deployment does not create Azure role assignments or change existing resources in `grill-me-edu`.
- [x] No connection keys or secrets are added to source control.

## Validation
- `./infra/test/infra.test.ps1` ??expected topology and auth/data boundary assertions pass.
- `az bicep build --file infra/main.bicep` ??expected template compile success.

## Commit Message
```text
ops(azure): adapt isolated game stack for free static hosting

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T01-infra-template

- Use a Free Static Web App with direct Function API calls
- Defer managed identity data-role grants to a scoped admin step
```

## Progress
- [x] Implementation complete
- [x] Validation passed
- `./infra/test/infra.test.ps1`: passed.
- `az bicep build --file infra/main.bicep`: passed.
- commit: recorded in Git history
