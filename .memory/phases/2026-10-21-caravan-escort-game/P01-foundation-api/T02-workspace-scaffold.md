# Task: T02 TypeScript 워크스페이스 기반

## Status: pending

## Goal
앱 코드가 없는 저장소에 웹, API, 공용 계약 패키지를 분리한 빌드 가능한 TypeScript 프로젝트 기반을 만든다.

## Decision Summary
- npm workspaces 모노레포, `apps/web` Vite + React + Phaser, `apps/api` Azure Functions Node v4, `packages/contracts` 공용 타입을 사용한다.
- Node.js 24, TypeScript strict mode, Vitest를 사용한다. 배포 전용 파일은 P05에서 다룬다.

## Implementation

### I01. Workspace와 공용 계약 패키지 초기화
- Related Files:
  - `package.json` :: root workspaces/scripts — 설치와 검증 진입점; new
  - `package-lock.json` :: npm dependency lock — 재현 가능한 설치; generated
  - `tsconfig.base.json` :: shared compiler options — strict TS 설정; new
  - `.gitignore` :: generated files — `node_modules`, `dist`, local env 차단; new
  - `packages/contracts/package.json` :: package metadata/exports — 내부 `@caravan/contracts`; new
  - `packages/contracts/tsconfig.json` :: contracts build — declaration output; new
  - `packages/contracts/src/index.ts` :: public contract exports — feature phases가 쓸 빈 초기 export; new
#### Details
- **Signatures & Types**:
  ```typescript
  export type CharacterId = 'hero' | 'archer' | 'mage' | 'merchant' | 'dark-hero';
  export type KarmaTier = 'good' | 'neutral' | 'evil';
  export type RunStatus = 'active' | 'won' | 'lost';
  ```
- **Data & Schema Fields**: root scripts는 `dev:web`, `dev:api`, `build`, `typecheck`, `test`를 제공한다. shared compiler는 `strict`, `noUncheckedIndexedAccess`, ES2022, ES modules를 켠다. 빈 contracts package는 이후 T04에서 실제 DTO로 확장한다.
- **Execution Flow / Logic**: npm install은 workspace lockfile을 생성한다. root build는 contracts → api와 web 순으로 실행한다. `apps/web` 및 `apps/api`는 각각 `@caravan/contracts`를 workspace dependency로 참조한다.
- **Error & Exception Handling**: 의존성 설치/빌드 실패 시 스크립트가 0이 아닌 종료 코드를 반환한다. `.env*`는 예시 파일만 제외하고 실제 secret 파일은 gitignore 한다.

### I02. 웹·API 실행 셸 설정
- Related Files:
  - `apps/web/package.json` :: web scripts/dependencies — Vite 앱; new
  - `apps/web/index.html` :: `#root` mount — 브라우저 진입점; new
  - `apps/web/src/main.tsx` :: `createRoot` — React 초기화; new
  - `apps/web/src/App.tsx` :: `App` — 초기 앱 셸; new
  - `apps/web/vite.config.ts` :: `/api` proxy — local API routing; new
  - `apps/api/package.json` :: Functions scripts/dependencies — Node API; new
  - `apps/api/host.json` :: host configuration — Functions v4 기본 설정; new
  - `apps/api/src/functions/index.ts` :: function registration entry — v4 등록 진입점; new
#### Details
- **Signatures & Types**:
  ```typescript
  export function App(): JSX.Element;
  export const app: import('@azure/functions').App;
  ```
- **Data & Schema Fields**: 웹 의존성 `react`, `react-dom`, `phaser`; 개발 의존성 `vite`, `typescript`, `vitest`, React type packages. API 의존성 `@azure/functions`; 개발 의존성 TypeScript와 Vitest. 버전은 작업 시 호환 최신 버전을 설치하고 lockfile에 고정한다.
- **Execution Flow / Logic**: Vite 개발 서버는 `/api/*`를 로컬 Functions Core Tools 주소로 proxy한다. 기본 페이지는 앱 제목과 로그인 전 상태를 렌더링하되 인증 흐름은 T03에서 구현한다. API entry가 시작되면 Functions v4 HTTP registration이 로드된다.
- **Error & Exception Handling**: 필수 환경변수 미설정은 개발 서버 시작 때 변수명을 표시한다. secret 값은 브라우저 번들에 포함하지 않는다.

## Acceptance Criteria
- [ ] `npm install`로 workspace가 설치되고 lockfile이 생성됨
- [ ] `npm run typecheck` 및 `npm run build`가 통과함
- [ ] 웹과 API를 각각 로컬 실행하는 스크립트가 제공됨

## Validation
- `npm run typecheck` — 모든 workspace TypeScript 오류 0건
- `npm run build` — Vite 정적 번들과 Functions 배포 출력 생성

## Commit Message
```text
feat(scaffold): create TypeScript web and API workspaces

Plan: 2026-10-21-caravan-escort-game
Phase: P01-foundation-api
Task: T02-workspace-scaffold

- Set up npm workspaces for web, API, and shared contracts
- Add React, Phaser, Azure Functions, and strict TypeScript shells
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
