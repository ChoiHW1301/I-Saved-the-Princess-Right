# Task: T03 Configure and Deploy Web Client

## Status: superseded

This task targets the old Static Web App and linked API architecture. It is replaced by [T04 Configure DEX Redirect and Deploy React Web](../../2026-10-27-caravan-grill-me-edu-deployment/P01-static-site-stack/T04-deploy-web.md), which uses a new Free Static Web App and a direct Function API URL.

## Goal
Configure the existing DEX SPA registration for the deployed Static Web App origin and deploy the React client with public Entra settings.

## Decision Summary
- Keep the Web app single-tenant and use delegated scope `api://c24b0058-31c5-4b44-8da0-36a6b9e68bbc/access_as_user`.
- Use the Static Web Apps linked backend so the client can call same-origin `/api`; no API key or client secret goes into Vite variables.

## Implementation

### I01. Configure SPA redirect and build settings
- Related Files:
  - `apps/web/.env.example` :: public Vite variable names — read-only.
  - `scripts/deploy-web.ps1` :: build and SWA deployment — execute.
- Details:
  - Retrieve the `Caravan Escort Web` application client ID by exact display name from Entra; verify exactly one matching app.
  - Add `https://<T01-output-static-hostname>/` to the app's SPA redirect URI list while retaining the existing localhost URI.
  - Set process-scoped public build variables: `VITE_ENTRA_TENANT_ID=69c1e470-4528-435a-a1ae-de98e0aac738`, `VITE_ENTRA_WEB_CLIENT_ID=<web-client-id>`, and `VITE_ENTRA_API_SCOPE=api://c24b0058-31c5-4b44-8da0-36a6b9e68bbc/access_as_user`. Leave `VITE_API_BASE_URL` empty to use the linked backend and `VITE_LOCAL_PLAYTEST=false`.
  - Do not commit `.env.local`, deployment token, or client secret. Public app IDs may be used for build configuration but should not be emitted into logs unnecessarily.

### I02. Deploy Static Web App
- Related Files:
  - `scripts/deploy-web.ps1` :: build and deploy using an in-memory SWA token — execute.
- Details:
  - Confirm `swa` CLI is installed; if missing, use `npx --yes @azure/static-web-apps-cli` without persisting a global install.
  - Deploy to production environment of this dev-only Static Web App.
  - Record the public hostname and deployment timestamp, never the deployment token.

## Acceptance Criteria
- [ ] Redirect URI list includes the deployed origin and keeps localhost.
- [ ] Web client builds with the exact DEX tenant, SPA client ID, and API delegated scope.
- [ ] Static Web App serves the deployed app and its linked `/api` backend.

## Validation
- `npm run build --workspace @caravan/web` — expected production build success.
- `./scripts/deploy-web.ps1 -ResourceGroup rg-caravan-game-dev -StaticSiteName <static-site-name>` — expected successful deploy.
- `Invoke-WebRequest https://<static-hostname>/ -UseBasicParsing` — expected HTTP 200.

## Commit Message
```text
ops(azure): deploy DEX-authenticated web client

Plan: 2026-10-27-azure-persistence-connection
Phase: P01-dev-deployment
Task: T03-deploy-web

- Configure SPA redirect and public API scope values
- Deploy the client through Azure Static Web Apps
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
