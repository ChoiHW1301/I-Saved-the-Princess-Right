# Plan: 마차 호위 중세 판타지 게임

## Goal
DEX 직원이 Azure Entra ID로 로그인해 플레이하는 1인 브라우저 게임을 구축한다. 15분 호위 챕터, 이벤트·준보스·카르마별 결말, 계정 진행 저장, 중간 저장·이어하기, 영구 성장, 상위 10위 랭킹을 구현한다.

## Confirmed Product Decisions
- 상세 요구사항: [결정 문서](../decisions/2026-10-21-caravan-escort-game.md)
- 게임: React + Phaser, 데스크톱, 픽셀 아트, WASD/방향키, 자동 공격.
- 인증/저장: DEX 직원 Entra 보안 그룹, Azure Functions API, Cosmos DB.
- 콘텐츠: 마왕성 → 용암지대 → 초원·마을, 3분 이벤트, 5·10분 준보스, 15분 최종전.
- 기록: 점수 랭킹과 캐릭터·카르마별 클리어 랭킹. 각 보드별 직원 최고 기록, 상위 10명 공개.

## Planning Defaults (기존 코드에서 찾을 수 없어 구체화를 위한 기본값)
- 저장소가 앱 코드 없이 시작하므로 npm workspaces 모노레포와 TypeScript를 사용한다. 웹은 Vite + React, API는 Azure Functions Node.js v4 모델로 구성한다.
- 프론트는 Azure Static Web Apps Standard에 배포하고, API는 별도 Azure Functions 앱으로 연결한다. Cosmos DB 접근은 Function 관리 ID로 제한한다.
- 브라우저 로그인은 MSAL React로 처리하고, API는 Entra access token의 서명·발급자·대상·`CaravanGame.Player` 역할을 검증한다. DEX 직원 그룹에 해당 앱 역할을 할당하는 설정은 운영 환경에서 필요하다.
- API 구현은 Node.js 24, Cosmos DB for NoSQL, `@azure/cosmos`, `@azure/identity`, Azure Functions Node v4를 기준으로 한다. 의존성은 작업 시 최신 호환 버전을 lockfile에 고정한다.
- 프론트/API 공용 계약은 `packages/contracts`에 둔다. 테스트는 Vitest(단위/API), Playwright(브라우저 주요 흐름)를 사용한다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | 앱 기반, Entra 직원 인증, Cosmos 계정·저장·랭킹 API | [P01](../phases/2026-10-21-caravan-escort-game/P01-foundation-api/phase.md) |
| P02 | `pending` | Phaser 전투 장면과 생존형 액션 코어 | [P02](../phases/2026-10-21-caravan-escort-game/P02-gameplay-core/phase.md) |
| P03 | `pending` | 캠페인 시간표, 이벤트, 카르마, 보스, 캐릭터 성장 | [P03](../phases/2026-10-21-caravan-escort-game/P03-campaign-content/phase.md) |
| P04 | `pending` | React 메뉴, 계정 성장, 임시 저장·이어하기, 랭킹 연동 | [P04](../phases/2026-10-21-caravan-escort-game/P04-account-ui/phase.md) |
| P05 | `pending` | Azure 인프라·배포 설정과 배포 검증 절차 | [P05](../phases/2026-10-21-caravan-escort-game/P05-cloud-release/phase.md) |

## Execution Notes
- 계획 단계에서는 구현을 하지 않는다. 각 Task는 구현, 검증, Task 상태 갱신, 커밋 순으로 실행한다.
- 실제 DEX Entra tenant/app/group IDs와 Azure 구독·리소스 그룹은 저장소에 없다. 배포 전에 회사 환경에서 받아 환경 변수와 권한 할당에 넣어야 한다.
- 현재 디렉터리는 Git 저장소가 아니다. Task별 커밋 메시지는 제공하지만, `/memory-execute`의 커밋 단계 전에 저장소 소유자가 Git을 초기화하거나 Git 저장소에서 작업해야 한다.
- 클라이언트가 제출하는 처치 수·골드·결과는 브라우저 변조가 가능하다. 첫 버전은 서버에서 점수·보상 계산과 입력 범위 검증을 수행하되, 완전한 치트 방지용 서버 권위 시뮬레이션은 범위에 없다.

## Official Technical References
- [Azure Static Web Apps API integration](https://learn.microsoft.com/en-us/azure/static-web-apps/apis-functions)
- [Bring your own Azure Functions app to Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/functions-bring-your-own)
- [Azure Functions Node.js programming model](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Microsoft Authentication Library overview](https://learn.microsoft.com/en-us/entra/identity-platform/msal-overview)
- [Cosmos DB JavaScript SDK](https://learn.microsoft.com/en-us/azure/cosmos-db/sdk-nodejs)
