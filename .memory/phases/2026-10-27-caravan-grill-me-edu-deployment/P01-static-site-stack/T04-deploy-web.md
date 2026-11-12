# Task: T04 Configure DEX Redirect and Deploy React Web

## Status: pending

## Goal
Build the React client with the new direct Function API origin and deploy it to the Free Static Web App in `grill-me-edu`.

## Decision Summary
- Reuse the existing DEX web/API registrations and delegated API scope.
- Use direct Function requests from the Free SWA; the API URL is a public origin, while authentication continues through MSAL access tokens and API role checks.
- Use the existing PowerShell/SWA CLI deployment; do not add GitHub Actions or commit deployment tokens.

## Implementation

### I01. Configure the existing web app registration
- Related Files:
  - `apps/web/src/auth/msalConfig.ts` :: `apiScope` — read-only.
  - `apps/web/.env.example` :: public Vite build variables — read-only.
  - Entra app registration `Caravan Escort Web` :: SPA redirect URI list — update externally.
- Details:
  - Retrieve the Web app client ID from the exact DEX app registration `Caravan Escort Web`; confirm there is exactly one matching registration.
  - Add `https://<new-swa-hostname>/` to the SPA redirect URI list, retaining `http://localhost:5173/` and any other intentionally used development URI.
  - Keep the existing delegated API scope `api://c24b0058-31c5-4b44-8da0-36a6b9e68bbc/access_as_user`; do not create a second registration, consent grant, or app role.
  - If `hw.choi2@dexconsulting.net` cannot update the registration, request only the URI update from its owner/admin; no tenant-wide admin account is needed for deployment.

### I02. Build and deploy the SPA
- Related Files:
  - `apps/web/src/auth/apiUrl.ts` :: `apiUrl(path)` — read-only; it joins the configured origin with `/api`.
  - `scripts/deploy-web.ps1` :: required environment checks, build, token retrieval, and SWA CLI deployment — modify if needed to require `VITE_API_BASE_URL` for release deployment.
  - `apps/web/public/staticwebapp.config.json` :: SPA fallback — read-only.
- Details:
  - Set process-scoped variables: `VITE_ENTRA_TENANT_ID=69c1e470-4528-435a-a1ae-de98e0aac738`, `VITE_ENTRA_WEB_CLIENT_ID=<Caravan Escort Web client ID>`, `VITE_ENTRA_API_SCOPE=api://c24b0058-31c5-4b44-8da0-36a6b9e68bbc/access_as_user`, and `VITE_API_BASE_URL=https://<new-function-host>`.
  - Ensure `VITE_LOCAL_PLAYTEST=false` for production deployment. Do not put secrets or the SWA token in any `VITE_*` variable.
  - Build with the existing workspace scripts and run `scripts/deploy-web.ps1` with `ResourceGroup=grill-me-edu` and the new Free SWA name.
  - Keep the deployment token only in the script's process environment; never log, persist, or commit it.
  - Verify the production site loads and browser network requests call `https://<function-host>/api/...` with the Entra bearer token.

## Acceptance Criteria
- [ ] New SWA origin is an SPA redirect URI and localhost remains configured.
- [ ] Production build contains the new Function origin and existing DEX scope, with local playtest disabled.
- [ ] Free Static Web App returns the React site and API CORS permits only that origin.
- [ ] No app secret, deployment token, or access token is committed or printed.

## Validation
- `npm run build --workspace @caravan/contracts; npm run build --workspace @caravan/web` with the variables above — expected production build success.
- `./scripts/deploy-web.ps1 -ResourceGroup grill-me-edu -StaticSiteName <new-swa>` — expected successful production deployment.
- `Invoke-WebRequest https://<new-swa-hostname>/` — expected HTTP 200.
- Browser DevTools network check — expected direct Function `/api` requests, CORS success, and no token leakage into URLs/logs.

## Commit Message
```text
ops(azure): deploy DEX-authenticated React site

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T04-deploy-web

- Configure the new SPA redirect and direct API origin
- Deploy the React client to the Free Static Web App
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
