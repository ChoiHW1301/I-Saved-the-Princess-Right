# Task: T01 훨윈드 캐릭터 회전 표시

## Status: done

## Goal
전사가 훨윈드를 선택한 동안 캐릭터 이미지가 제자리에서 선 채 계속 회전하는 모습을 보여주고 기존의 밝은 원형 섬광을 없앤다.

## Decision Summary
- `.memory/decisions/2026-11-17-caravan-whirlwind-character-spin.md`의 D01~D03을 따른다.
- 피해·범위·공격 주기는 유지하고 시각 연출만 수정한다.

## Implementation

### I01. 캐릭터 회전 시각 객체
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `create`, `update`, `chooseWarriorEvolution`, 게임 종료·재시작 정리; modify
  - `apps/web/src/game/entities/Warrior.ts` :: 기존 `updateWalkMotion`, 충돌 몸체 및 스프라이트 크기 참고; read-only
  - `apps/web/src/game/systems/WarriorEvolutionCombat.ts` :: `getWhirlwindIntervalMs`; read-only

#### Details
- **Signatures & Types**:
  ```typescript
  private whirlwindVisual: Phaser.GameObjects.Image | null;
  private whirlwindElapsedMs: number;
  private createWhirlwindVisual(): void;
  private updateWhirlwindVisual(delta: number): void;
  ```
- **Data & Schema Fields**: 원정/저장 스키마 변경 없음. `run.warriorEvolutionId === 'whirlwind'`와 `run.upgradeStats['attack-speed']`로 시각 회전 조건과 주기를 계산한다.
- **Execution Flow / Logic**:
  1. 선택 직후 또는 저장 복원으로 훨윈드가 설정된 경우, 전사와 동일한 텍스처·표시 크기(78×70)의 별도 이미지를 만들고 전사와 같은 위치·깊이로 둔다. 실제 `Warrior` 물리 몸체의 크기와 방향은 시각 연출 때문에 바꾸지 않는다.
  2. 활동 중 매 프레임 경과 시간을 누적하고 `getWhirlwindIntervalMs(attack-speed)`에 맞춰 0~1 회전 위상을 얻는다. 이미지의 가로폭을 코사인 곡선으로 부드럽게 좁혔다 넓히고 좌우 반전을 교차해, 선 자세로 도는 인상을 준다. 최소 가로폭을 제한해 사라지지 않게 한다.
  3. 별도 이미지의 위치·틴트·피격 투명도를 전사와 맞추고 원본 스프라이트만 투명하게 한다. 사망 시 이미지를 숨기고 부활 시 다시 보이게 한다. 장면 종료·재시작에서 이미지를 파괴한다.
  4. 훨윈드가 아닌 캐릭터나 진화에서는 기존 보행 이미지를 유지한다. 선택·일시정지 중에는 프레임이 갱신되지 않으므로 회전도 정지한다.

### I02. 공격 섬광 제거와 확인
- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `weaponSystem.update`의 `onFire` 중 `projectile.evolution === 'whirlwind'`; modify
  - `apps/web/src/game/test/WarriorEvolutionCombat.test.ts` :: 공격 간격·피해·범위 회귀 확인; read-only

#### Details
- 훨윈드의 넓은 원형 `Circle` 생성과 페이드 트윈을 제거한다. `WeaponSystem`의 타격 판정, 수치 및 다른 검/검기 이펙트는 바꾸지 않는다.
- 실제 회전 이미지는 공격 여부와 무관하게 계속 갱신되어야 한다.

## Acceptance Criteria
- [ ] 훨윈드 선택 전후 전사 이미지가 선 자세로 회전하고 공격 속도 증가 시 회전도 빨라진다.
- [ ] 밝은 큰 원형 공격 섬광이 나오지 않는다.
- [ ] 물리 충돌 범위, 다른 진화 공격, 저장 복원·사망·부활 화면 상태가 유지된다.

## Validation
- `npm run test --workspace @caravan/web -- WarriorEvolutionCombat.test.ts WarriorEvolution.test.ts` — 기존 훨윈드 전투 수치 회귀 검사
- `npm run typecheck` — Phaser 이미지와 장면 타입 검사
- `npm run build --workspace @caravan/web` — 프로덕션 렌더링 빌드

## Commit Message
```text
feat(game): animate warrior during whirlwind

Plan: 2026-11-17-caravan-whirlwind-character-spin
Phase: P01-whirlwind-visual
Task: T01-character-spin

- Animate upright warrior rotation in sync with attack speed
- Remove bright full-circle whirlwind flash
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: `d83c9fd`
