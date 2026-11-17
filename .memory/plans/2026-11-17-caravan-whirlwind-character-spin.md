# Plan: 훨윈드 캐릭터 회전 연출

## Goal
훨윈드 선택 시 전사 이미지가 선 자세로 지속 회전하는 모습으로 보이고, 눈부신 원형 공격 이펙트는 나오지 않게 한다. 공격 판정과 수치는 유지한다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 훨윈드 렌더링 교체 및 검증 | [P01](../phases/2026-11-17-caravan-whirlwind-character-spin/P01-whirlwind-visual/phase.md) |

## Execution Order
1. T01 훨윈드 캐릭터 회전 애니메이션 및 원형 섬광 제거

## Integration Rules
- `WeaponSystem`의 훨윈드 공격 간격·범위·피해 계산은 변경하지 않는다.
- 플레이어 충돌 몸체의 크기가 회전 연출로 달라지지 않도록 시각 이미지를 별도로 그린다.
- 저장 후 복원, 일시정지, 사망, 부활, 다른 진화에서 화면 상태를 정리한다.

## Completion
- 훨윈드 전사 이미지가 공격 속도에 맞춰 지속 회전하고 원형 섬광이 사라진다.
- 선택 및 저장 복원 시 정상 표시되며 웹 테스트·타입 검사·빌드가 통과한다.
