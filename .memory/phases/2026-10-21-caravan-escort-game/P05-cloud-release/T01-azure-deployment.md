# Task: T01 Azure 리소스와 배포 설정

## Status: pending

## Goal
웹 정적 호스팅, 독립 Functions API, Cosmos DB, 진단 리소스를 구성 코드와 환경 변수 문서로 재현 가능하게 정의한다.

## Decision Summary
- Azure Static Web Apps Standard와 별도 Azure Functions 앱(BYO Functions), Cosmos DB for NoSQL을 사용한다.
- 함수 앱은 현재 지원되는 Node.js 24와 Functions v4를 기준으로 하며 Cosmos는 managed identity로만 접근한다.

## Implementation

### I01. Infrastructure as Code
- Related Files:
  - `infra/main.bicep` :: `staticWebApp`, `functionApp`, `cosmosAccount`, database/containers — Azure resources; new
  - `infra/main.bicepparam` :: environment parameters — names/location/sku; new
  - `infra/modules/roleAssignments.bicep` :: Cosmos data role — managed identity access; new
  - `apps/api/host.json` :: `version` and route prefix — function runtime; modify
  - `infra/test/infra.test.ps1` :: template validation; new
- **Signatures & Types**:
  ```bicep
  param location string
  param environmentName string
  param staticSiteName string
  param functionName string
  param cosmosAccountName string
  param cosmosDatabaseName string = 'caravan-game'
  ```
- **Data & Schema Fields**: Create SWA Standard, Linux Function App on Flex Consumption Node 24/Functions v4, storage account, Application Insights, Cosmos SQL API account, database `caravan-game`, containers `profiles` PK `/userId`, `saves` PK `/userId`, `leaderboards` PK `/boardId`. `profiles` stores profile and run receipt docs in the same `/userId` partition. Enable system-assigned Function identity and grant Cosmos DB Built-in Data Contributor. App settings: `ENTRA_TENANT_ID`, `ENTRA_API_AUDIENCE`, `COSMOS_ENDPOINT`, `APPLICATIONINSIGHTS_CONNECTION_STRING`; do not put secrets or client secrets in Bicep parameters.
- **Execution Flow / Logic**: validate resource names and region; deploy resources into an existing resource group; output SWA hostname, Function name, Cosmos endpoint, and identity principal ID. Static app build uses `apps/web/dist`; API is separately built/deployed then linked through the SWA Standard BYO Functions integration.
- **Error & Exception Handling**: Bicep `@minLength/@maxLength` and name constraints validate parameters; deployments are incremental; no destructive database/container replacement; deployment fails if selected region lacks required SKU/runtime.

### I02. Build and route configuration
- Related Files:
  - `apps/web/staticwebapp.config.json` :: SPA fallback and security headers — route policy; new
  - `apps/api/src/config/env.ts` :: production config validation — modify
  - `.env.example` :: local public/private variable names — new
  - `docs/deployment/azure-architecture.md` :: deploy topology and env map — new
- **Data & Schema Fields**: `VITE_ENTRA_TENANT_ID`, `VITE_ENTRA_WEB_CLIENT_ID`, `VITE_ENTRA_API_SCOPE`, `VITE_API_BASE_URL` are web build settings; server-only Function settings include API audience, tenant, Cosmos endpoint. `VITE_` values are public and contain no secrets.
- **Execution Flow / Logic**: SWA routes SPA requests to `index.html`, forwards `/api/*` to linked Function app, and applies HTTPS/security headers. API's `/api` prefix remains enabled for the linked backend. `.env.example` documents names and sample non-secret placeholders only.
- **Error & Exception Handling**: missing server settings stop Function startup with explicit setting name; access tokens and Cosmos credentials are never logged or bundled.

## Acceptance Criteria
- [ ] Bicep template provisions the complete non-identity Azure topology and Cosmos containers
- [ ] Function system identity has data-plane access to Cosmos without keys
- [ ] SWA build output and `/api` routing match the monorepo paths
- [ ] Environment documentation distinguishes browser-public settings from API-only settings

## Validation
- `az bicep build --file infra/main.bicep` — template compiles
- `npm run build` — web/API production artifacts compile
- `npm run test:infra` — template assertions pass without deploying resources

## Commit Message
```text
feat(infra): define Azure hosting and managed data access

Plan: 2026-10-21-caravan-escort-game
Phase: P05-cloud-release
Task: T01-azure-deployment

- Provision Static Web Apps, Functions, Cosmos, and diagnostics
- Configure managed identity and secure environment boundaries
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
