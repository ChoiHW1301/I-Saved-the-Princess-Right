# Plan: 용암 마법진 범위와 매지션 위치

결정 문서: [용암 마법진 범위와 매지션 위치](../decisions/2026-11-16-caravan-lava-sigil-area-centering.md)

## Goal
라바 매지션 마법진의 표시·공격 가능 범위를 실제 폭발 반경 100 월드픽셀과 맞추고, 공격으로 파괴될 때 파편 이펙트를 보여준다. 매지션은 화면 네 변의 중앙에 출현하고 체력 구간마다 그 네 지점 중 하나로 순간이동한다.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `done` | 마법진 범위 표시·피격 범위, 파괴 이펙트, 매지션 네 변 중앙 배치 | [P01](../phases/2026-11-16-caravan-lava-sigil-area-centering/P01-sigil-and-mage-placement/phase.md) |

## 확정 동작
- 폭발 판정 반경 100px는 유지한다. 마법진 이미지는 200×200 world px로 보이고 원형 범위 표시/공격 hit radius는 100px다.
- 원형 범위 링은 마법진 활성 중 보이며, 폭발 직전 기존 경고 원이 같은 반경을 채운다.
- 무기로 파괴할 때는 100px 범위 테두리에서 출발하는 짧은 충격파와 픽셀 파편을 재생한다. 시간 만료 폭발은 기존 피해/폭발 로직을 사용한다.
- 매지션은 4개 변 중앙 중 선택한다: 좌 `(inset, height/2)`, 우 `(width-inset, height/2)`, 위 `(width/2, inset)`, 아래 `(width/2, height-inset)`, `inset=BOSS_COLLISION_RADIUS+2`.

## 작업 순서
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `in_progress` | 범위·파괴 연출과 매지션 변 중앙 선택을 구현하고 검증 | [T01](../phases/2026-11-16-caravan-lava-sigil-area-centering/P01-sigil-and-mage-placement/T01-sigil-area-and-center-edges.md) |

## 완료 기준
- 매지션의 시작·텔레포트 좌표가 화면 네 변의 중앙이며 enlarged boss body가 화면 안에 남는다.
- 마법진 그림, 범위 링, 타격 판정, 폭발 판정의 반경이 모두 100px와 일치한다.
- 공격 파괴는 파편 연출을 내고 제거되며, 만료된 마법진은 기존 폭발 피해를 유지한다.
- 관련 테스트, 웹 타입 검사, 프로덕션 빌드가 통과한다.
