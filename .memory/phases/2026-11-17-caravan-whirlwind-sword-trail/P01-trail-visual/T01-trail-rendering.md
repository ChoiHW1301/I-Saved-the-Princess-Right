# Task: T01 훨윈드 검 궤적 렌더링

## Status: done

## Goal
현재 캐릭터 회전은 유지하고, 손에 든 검이 몸 주위를 휘두를 때 남는 팽이 모양 잔상을 전사 앞뒤로 보이게 한다.

## Decision Summary
- `.memory/decisions/2026-11-17-caravan-whirlwind-sword-trail.md` D01~D03.
- 화면 전체를 번쩍이는 기존 원형 효과는 복원하지 않는다.

## Implementation

### I01. 지속 검 궤적
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `createWhirlwindVisual`, `updateWhirlwindVisual`, 장면 생성·종료, 사망 처리; modify
  - `apps/web/src/game/systems/WarriorEvolutionCombat.ts` :: `getWhirlwindIntervalMs`; read-only

#### Details
- **Signatures & Types**:
  ```typescript
  private whirlwindTrailBack: Phaser.GameObjects.Graphics | null;
  private whirlwindTrailFront: Phaser.GameObjects.Graphics | null;
  private drawWhirlwindTrail(phase: number, radius: number): void;
  ```
- **Data & Schema Fields**: 저장 상태와 API 변경 없음. 기존 `warriorEvolutionId`, `upgradeStats['attack-speed']`, `upgradeStats['sword-range']`만 읽는다.
- **Execution Flow / Logic**:
  1. 훨윈드 시각 객체 생성 시 전사 뒤·앞 깊이에 각각 재사용 가능한 `Graphics`를 만든다.
  2. 기존 회전 위상 `whirlwindElapsedMs / getWhirlwindIntervalMs(attack-speed)`와 동일한 위상으로 검 궤적을 매 프레임 갱신한다. 원형 판정 범위와 별개로 타원형 호를 사용한다.
  3. 반투명한 따뜻한 금빛의 긴 잔상과 짧은 밝은 검 끝부분, 얇은 은빛 안쪽 흐름을 그린다. 앞·뒤 반원에 해당하는 선분을 깊이별 Graphics에 나눠 그려 캐릭터 몸을 통과하는 느낌을 피한다.
  4. 기본 반경은 캐릭터 주위의 약 85~95 월드픽셀로 하고 `sword-range` 강화에 비례해 소폭 증가시키되 상한을 둔다. 이펙트는 공격 주기와 함께 빨라진다.
  5. 사망 시 숨기고 부활 시 다시 표시한다. 장면 생성·종료에서 Graphics를 파괴하고 null로 초기화한다. 다른 진화와 캐릭터에는 생성하지 않는다.
- **Error & State Transition**: 선택·일시정지 중 장면 업데이트가 멈추면 궤적도 그 자리에서 멈춘다. 그래픽 생성 실패 시 전투 판정은 기존 WeaponSystem을 따르므로 영향받지 않는다.

## Acceptance Criteria
- [x] 캐릭터의 기존 회전은 그대로이고, 검의 연속 궤적이 몸 주위를 감싼다.
- [x] 궤적은 공격 속도 강화에 맞춰 빨라지며 지속적으로 보인다.
- [x] 밝은 전체 원 섬광을 복원하지 않고, 다른 진화·사망·부활에 잔상이 남지 않는다.

## Validation
- `npm run test --workspace @caravan/web -- WarriorEvolutionCombat.test.ts WarriorEvolution.test.ts` — 전투 수치 회귀 확인
- `npm run typecheck` — Phaser Graphics·장면 타입 확인
- `npm run build --workspace @caravan/web` — 웹 프로덕션 빌드 확인

## Commit Message
```text
feat(game): add restrained whirlwind sword trail

Plan: 2026-11-17-caravan-whirlwind-sword-trail
Phase: P01-trail-visual
Task: T01-trail-rendering

- Draw synchronized sword sweep around the spinning warrior
- Layer subtle amber and silver trails around the character
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: `20bd761`
