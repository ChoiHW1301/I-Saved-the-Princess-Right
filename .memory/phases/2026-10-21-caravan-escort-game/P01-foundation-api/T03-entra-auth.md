# Task: T03 Entra 로그인과 DEX 직원 API 보호

## Status: done

## Goal
DEX 직원 전용 Entra 로그인과 API 접근 검증을 구성해 비인가 사용자가 게임 데이터를 읽거나 바꾸지 못하게 한다.

## Decision Summary
- SPA 로그인은 `@azure/msal-browser`와 `@azure/msal-react`를 사용한다. API bearer token은 tenant, signature, audience, role을 서버에서 검증한다.
- Entra 관리자는 `CaravanGame.Player` 앱 역할을 DEX 직원 보안 그룹에 할당한다. 역할이 없는 계정은 403이다.

## Implementation

### I01. MSAL SPA 설정과 로그인 상태
- Related Files:
  - `apps/web/src/auth/msalConfig.ts` :: `msalInstance`, `loginRequest` — tenant/app/scope config; new
  - `apps/web/src/auth/AuthProvider.tsx` :: `AuthProvider` — MSAL context; new
  - `apps/web/src/auth/RequireAuth.tsx` :: `RequireAuth` — 로그인 gate; new
  - `apps/web/src/auth/useApiToken.ts` :: `useApiToken` — API token acquire; new
  - `apps/web/src/main.tsx` :: `MsalProvider` — provider wiring; modify
- **Signatures & Types**:
  ```typescript
  export const msalInstance: PublicClientApplication;
  export const loginRequest: { scopes: string[] };
  export function RequireAuth(props: { children: React.ReactNode }): JSX.Element;
  export function useApiToken(): { getToken(): Promise<string> };
  ```
- **Data & Schema Fields**: build-time public values: `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_WEB_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`; no client secret. Token request scope is the API exposed scope `api://<API_APP_ID>/access_as_user`.
- **Execution Flow / Logic**: unauthenticated user sees a sign-in screen and starts redirect login. Authenticated account requests token silently; if interaction is required, the UI invokes redirect token acquisition. `RequireAuth` waits for MSAL interaction state before deciding.
- **Error & Exception Handling**: login cancellation returns to signed-out screen; `InteractionRequiredAuthError` triggers redirect; other auth errors render a retry message without exposing token contents.

### I02. Azure Function token and role guard
- Related Files:
  - `apps/api/src/auth/authorize.ts` :: `authorizeRequest`, `Caller` — JWT verification and caller extraction; new
  - `apps/api/src/auth/errors.ts` :: `AuthError` — 401/403 distinction; new
  - `apps/api/src/config/env.ts` :: `readAuthConfig` — validated API env; new
  - `apps/api/src/functions/health.ts` :: `health` — liveness endpoint; new
  - `apps/api/test/auth/authorize.test.ts` :: auth guard cases; new
- **Signatures & Types**:
  ```typescript
  export interface Caller { tenantId: string; objectId: string; displayName: string; }
  export async function authorizeRequest(request: HttpRequest): Promise<Caller>;
  export class AuthError extends Error { status: 401 | 403; }
  ```
- **Data & Schema Fields**: required environment: `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `COSMOS_ENDPOINT`. Token must have valid issuer `https://login.microsoftonline.com/{tenantId}/v2.0`, expected audience, `oid`, `tid`, `name`, and `roles` containing `CaravanGame.Player`.
- **Execution Flow / Logic**: require `Authorization: Bearer <JWT>`; resolve signing keys from tenant OpenID metadata; verify signature/issuer/audience/expiry; reject wrong tenant; then require role; return `Caller` from verified claims only. API handlers call guard before reading or mutating account data.
- **Error & Exception Handling**: missing/invalid/expired token → 401 `UNAUTHENTICATED`; valid user without role → 403 `FORBIDDEN`; malformed auth config → startup error. Never log bearer tokens.

## Acceptance Criteria
- [ ] Only an account with `CaravanGame.Player` can access protected API routes
- [ ] Frontend supports sign-in, sign-out, silent token, and reauthentication prompt
- [ ] Auth tests cover missing, expired, wrong tenant/audience, missing role, and valid token

## Validation
- `npm run test --workspace apps/api -- test/auth/authorize.test.ts` — all guard cases pass
- `npm run typecheck` — frontend and API typecheck cleanly

## Commit Message
```text
feat(auth): restrict game access to DEX Entra members

Plan: 2026-10-21-caravan-escort-game
Phase: P01-foundation-api
Task: T03-entra-auth

- Add MSAL login and API token acquisition
- Validate Entra JWTs and DEX player app role in Functions
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: created (see `git log`)
