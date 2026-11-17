# Plan: 5분 보스 클리어 후 진화 테스트

## Goal
개발자 모드에서 용암 거인 또는 라바 매지션의 ‘보스 클리어 후’ 테스트를 시작하면 무작위 두 진화 트리를 기존 선택창에 띄우고, 선택 후 전투가 진행되도록 한다. 10분·15분 클리어 후 테스트와 일반 원정은 유지한다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 클리어 후 테스트의 5분 진화 선택 연결 | [P01](../phases/2026-11-17-caravan-post-clear-evolution-test/P01-post-clear-evolution/phase.md) |

## Execution Order
1. T01 개발자 5분 클리어 후 테스트에서 두 진화 트리를 제시하고 선택을 게임 상태에 반영한다.

## Integration Rules
- `HomePage.startDeveloperPostClearTest`와 `GameCanvas`가 이미 보스 ID를 `CaravanScene`에 전달하므로 공개 UI와 일반 원정 계약은 바꾸지 않는다.
- 용암 거인과 라바 매지션의 클리어 후 시작에서만 `rollWarriorEvolutionChoices`를 호출한다.
- 선택 후 이미 클리어된 `lava-5min-slot`에 `boss-defeated`를 다시 발행하지 않는다.
- 기존 개발자 테스트의 비저장 동작을 유지한다.

## Completion
- 5분 클리어 후 테스트의 진화 선택, 선택 후 재개, 10분·15분 미변경이 확인된다.
- 웹 테스트, 타입 검사, 프로덕션 빌드가 통과한다.
