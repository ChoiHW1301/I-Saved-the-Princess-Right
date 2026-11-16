# Task: T04 Boss Visuals

## Status: pending

## Goal
두 보스를 기존 어두운 도트풍 월드에서 구분 가능하게 표시하고, 거인의 돌진과 마법진 폭발을 플레이어가 미리 읽을 수 있는 시각 신호로 전달한다.

## Decision Summary
- 거인은 4방향 렌더링을 하고 수평 방향은 좌우 반전으로 재사용한다. 대각선은 상·하·좌·우 중 가까운 방향을 쓴다.
- 돌진 예고 화살표는 반투명하며 플레이어 조준 방향을 따르고, 벽 충돌 스턴에는 넘어짐·약점 연출을 붙인다. 마법진은 3초 폭발 대기 중 화면에 경고가 누적된다.

## Implementation

### I01. 픽셀 스프라이트 에셋과 로드

- Related Files:
  - `apps/web/public/game-assets/monsters/lava-giant-up.png` — 거인 위 방향 스프라이트, 새 에셋
  - `apps/web/public/game-assets/monsters/lava-giant-down.png` — 거인 아래 방향 스프라이트, 새 에셋
  - `apps/web/public/game-assets/monsters/lava-giant-side.png` — 거인 측면, 좌우 반전 공용 스프라이트, 새 에셋
  - `apps/web/public/game-assets/monsters/lava-magician.png` — 매지션 전신 스프라이트, 새 에셋
  - `apps/web/public/game-assets/monsters/lava-sigil.png` — 바닥 마법진, 새 에셋
  - `apps/web/src/game/scenes/CaravanScene.ts` :: `preload` — 신규 텍스처 로드; modify
  - `apps/web/src/game/entities/Enemy.ts` :: constructor, `setBossDirection` — 보스 ID와 방향에 따른 본체 이미지; modify

#### Details
- **Asset Specifications**:
  - 각 몬스터 이미지는 256×256 투명 PNG, 캐릭터는 중앙 정렬, 프레임 바깥에 잘리지 않는 완전한 전신 픽셀아트로 제작한다. 게임 내 표시 크기는 기존 보스의 92×92 월드픽셀을 유지한다.
  - `lava-sigil.png`는 128×128 투명 PNG이며 생성·폭발 위험 원이 분명하게 보이는 탑다운 픽셀아트다.
  - 모두 기존 게임의 중세 판타지 팔레트에 맞추고, 보스 본체 외곽 대비를 확보한다. 에셋 생성은 이미지 생성 도구로 수행하고 원본 산출물을 저장소에 포함한다.
- **Signatures & Types**:
  ```typescript
  setBossDirection(dx: number, dy: number): void;
  setBossStunned(stunned: boolean): void;
  ```
- **Execution Flow / Logic**:
  1. `CaravanScene.preload`에 위 파일 경로를 각각 유일한 키로 등록한다.
  2. `Enemy`가 `definition.id === 'lava-giant'`이면 up/down/side texture 중 하나를 선택한다. `abs(dx) > abs(dy)`일 때 측면, 아니면 부호에 따라 up/down을 쓴다. 측면은 `dx < 0`일 때만 `flipX=true`다.
  3. `lava-magician`은 매지션 텍스처, 구형 `lava-behemoth`와 그 외 보스는 기존 `demon-sprite`를 쓴다.
  4. `setBossStunned(true)`는 눕힌 회전 각도와 바닥 그림자·취약 표식을 표시하고, `false`는 회전과 색조를 초기화한다. 상태 종료/엔티티 파괴 때 tween을 정리한다.
  5. `LavaSigil`은 새 바닥 이미지 위에 HP 3단계 상태(3/2/1 타격점)와 남은 3초 경고를 그린다. 남은 시간 1000ms 이하일 때 점멸을 시작하고 폭발 때 원형 범위 표시를 160 월드픽셀 지름으로 확대 후 제거한다.

### I02. 전투 텔레그래프와 보스 표시명

- Related Files:
  - `apps/web/src/game/scenes/CaravanScene.ts` :: 거인 `tell`/`charge`/`stunned`, 마법진 폭발 — Phaser 경고 VFX; modify
  - `apps/web/src/game/content/bosses.ts` :: `bossDisplayName` — 한글 보스명 매핑; modify
  - `apps/web/src/game/GameCanvas.tsx` :: `bossEncounter` 표시 — ID 변수를 그대로 노출하지 않고 지역화된 보스명 사용; modify
  - `apps/web/src/game/test/BossPresentation.test.ts` — 명칭과 방향 선택 검증; new

#### Details
- **Execution Flow / Logic**:
  1. Tell 동안 거인과 플레이어 사이에 두께 10 px, alpha 0.35의 주황색 화살표/방향선을 표시하고, 매 프레임 목표 방향에 맞춰 회전시킨다. 돌진 전환 프레임에 각도를 고정해 제거한다.
  2. Tell 중 몸체는 300ms에서 80ms까지 단계적으로 감소하는 `steps` 점멸 tween을 쓴다. charge 또는 상태 종료 시 tween은 반드시 중지한다.
  3. Charge 중에는 진행 방향 뒤에 짧은 불꽃 trail을 표시하고 종료 시 제거한다. 화면 흔들림은 180ms, 강도 0.006으로 한 번만 실행한다.
  4. Stun 중 거인 스프라이트는 넘어진 방향으로 눕고, 금빛 약점 표식과 1.5배 상태를 함께 표시한다. 스턴 종료 시 원위치로 되돌린다.
  5. Sigil은 바닥 위치에 생성하고 폭발 반경 100을 300ms 전부터 명확히 채운 원으로 표시한다. 피해 처리와 시각 원의 중심·반경을 같은 값으로 공유한다.
  6. 보스 표시명은 `lava-giant: '용암 거인'`, `lava-magician: '라바 매지션'`, `lava-behemoth: '용암 거인'`이며, 기존 보스는 현재 표시명 의미를 보존한다. `GameCanvas`는 `bossEncounter.bossId`를 `bossDisplayName`으로 바꿔 표시한다.

## Acceptance Criteria
- [ ] 거인 상·하·좌·우가 올바른 그래픽 방향으로 보이고 좌우는 측면 이미지 반전으로 그려진다.
- [ ] 거인의 예고 방향·몸체 점멸·돌진 흔적·벽 충돌 흔들림·스턴 약점이 읽히며 상태 해제 후 남은 tween이 없다.
- [ ] 마법진의 3/2/1 타격 상태와 폭발 위험 범위가 표시되고, 시각 범위가 실제 피해 반경 100과 일치한다.
- [ ] 보스 안내 UI가 `LAVA-GIANT` 같은 내부 ID 대신 한글 보스명을 표시한다.

## Validation
- `npm run test --workspace @caravan/web -- src/game/test/BossPresentation.test.ts` — 방향 매핑과 표시명 검증.
- `npm run typecheck --workspace @caravan/web` — 에셋 키와 씬 UI 타입 확인.
- `npm run build --workspace @caravan/web` — 모든 이미지 경로가 Vite public asset으로 정상 패키징되는지 확인.
- 브라우저 4:3 게임 화면에서 tell, 벽 충돌, stun, magic circle countdown을 확인한다.

## Commit Message
```text
feat(game): add readable lava boss pixel visuals

Plan: 2026-11-13-caravan-random-10min-boss
Phase: P01-lava-boss-encounters
Task: T04-boss-visuals

- Add distinct boss and sigil pixel assets
- Render direction, charge warning, stun weakness and localized names
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
