# Plan: 훨윈드 검 궤적

## Goal
기존 캐릭터 회전과 전투 수치를 유지하면서 참고 이미지처럼 검의 회전 궤적을 전사 주위에 추가한다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 훨윈드 지속 검 궤적 구현 | [P01](../phases/2026-11-17-caravan-whirlwind-sword-trail/P01-trail-visual/phase.md) |

## Execution Order
1. T01 전사의 회전 위상에 맞춰 앞·뒤 검 궤적을 그린다.

## Integration Rules
- `WeaponSystem`의 피해·범위·공격 간격은 변경하지 않는다.
- 캐릭터 회전용 `whirlwindVisual` 표시 방식은 유지한다.
- 정지·사망·부활·장면 종료에서 궤적 상태를 캐릭터와 함께 처리한다.
