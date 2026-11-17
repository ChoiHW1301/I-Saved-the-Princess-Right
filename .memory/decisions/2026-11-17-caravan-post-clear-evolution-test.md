# Decisions: 5분 보스 클리어 후 진화 테스트

- Date: 2026-11-17
- Status: Confirmed

## D01. 적용 범위
- **Chosen**: 개발자 모드의 ‘보스 클리어 후’ 목록 중 용암 거인과 라바 매지션의 5분 클리어 후 테스트에만 진화 선택을 추가한다. 10분·15분 테스트는 현재 동작을 유지한다.
- **Rationale**: 전사 진화 보상은 5분 중간보스 처치 보상이며, 기존 테스트 목록의 다른 시점에는 별도 선택을 끼워 넣지 않는다.

## D02. 선택 방식
- **Chosen**: 5분 클리어 후 테스트를 시작하면 실제 게임과 같은 균등한 무작위 두 트리를 기존 진화 선택창에 표시한다. 하나를 고른 뒤 선택한 효과로 클리어 후 맵에서 플레이한다.
- **Rationale**: 기존 `rollWarriorEvolutionChoices`와 `WarriorEvolutionOverlay`를 재사용해 실제 보상 선택 흐름을 검증한다.

## D03. 테스트 상태와 저장
- **Chosen**: 개발자 테스트는 기존처럼 전사로 시작하고 테스트 기록을 저장하지 않는다. 진화 선택은 시작할 때 만든 테스트용 원정 상태에만 적용한다.
- **Rationale**: 현재 `startDeveloperPostClearTest`가 전사를 지정하고, 개발자 보스 테스트 경로는 저장 대상에서 제외된다. 진화 선택 완료가 이미 클리어 처리된 보스의 보상을 다시 지급하지 않도록 한다.

## D04. 기존 코드 연결 지점
- **Chosen**: `HomePage`의 5분 클리어 후 진입, `GameCanvas`의 기존 진화 선택 UI, `CaravanScene`의 디버그 시작 상태를 연결한다. 일반 원정의 5분 보상 및 10분·15분 클리어 후 테스트 흐름은 변경하지 않는다.
- **Rationale**: 기존 코드의 `debugPostClearBossId`, `getBossPostClearTestScenario`, `fiveMinuteBossDeathPhase`가 필요한 분기를 제공한다.
