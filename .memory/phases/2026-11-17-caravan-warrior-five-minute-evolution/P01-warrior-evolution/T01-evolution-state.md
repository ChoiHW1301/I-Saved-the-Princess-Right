# Task: T01 진화 상태와 저장 계약

## Status: done

## Goal
전사의 선택된 진화 트리와 전용 강화 단계가 원정 상태·임시저장·레벨업 후보에 일관되게 반영되도록 한다. 기존 저장은 그대로 불러와야 한다.

## Decision Summary
- 진화 트리 ID는 `whirlwind | multi-sword | sword-wave | vanguard`; 기본값은 `null`이다.
- 5분 보상 후보는 네 트리 중 서로 다른 2개를 뽑는다. 6개 무순서 조합은 균등 확률이며, 선택한 트리의 강화만 레벨업 후보에 포함한다.

## Implementation

### I01. 진화 정의·후보 추첨
- Related Files:
  - `apps/web/src/game/content/warriorEvolution.ts` :: `WarriorEvolutionId`, `warriorEvolutionCatalog`, `rollWarriorEvolutionChoices` — 네 트리 메타데이터와 균등 추첨; new
  - `apps/web/src/game/test/WarriorEvolution.test.ts` :: `describe('warrior evolution')` — 추첨 경계와 조합 검증; new

#### Details
- **Signatures & Types**:
  ```typescript
  export type WarriorEvolutionId = 'whirlwind' | 'multi-sword' | 'sword-wave' | 'vanguard';
  export interface WarriorEvolutionDefinition { id: WarriorEvolutionId; name: string; description: string; upgradeId: string }
  export const warriorEvolutionCatalog: readonly WarriorEvolutionDefinition[];
  export function rollWarriorEvolutionChoices(random: () => number): readonly [WarriorEvolutionId, WarriorEvolutionId];
  ```
- **Data & Schema Fields**: 카탈로그 순서는 훨윈드, N도류, 검기, 선봉장. 각각의 `upgradeId`는 `whirlwind-damage`, `multi-sword-count`, `sword-wave-penetration`, `vanguard-heat`.
- **Execution Flow / Logic**:
  1. Precondition: 호출은 5분 보스 사망 연출 종료 후 전사·미선택 상태에서만 일어난다.
  2. Core Processing: `[0,1,2,3]`의 6개 인덱스 쌍을 명시적으로 열거하고 `Math.floor(clamp(random(), 0, 0.999999999) * 6)`으로 한 쌍을 고른다. 기존 `seededRandom` 함수를 사용해 원정 시드에 종속시킨다.
  3. Error: `NaN` 또는 무한 난수는 0으로 취급한다. 중복 후보를 반환하지 않는다.
  4. Return: 고정 순서의 서로 다른 두 ID. UI 제출 시 후보 집합에 없는 ID는 거부한다(T02).

### I02. RunState 및 저장 호환성
- Related Files:
  - `packages/contracts/src/gameplay.ts` :: `RunStateSchema`, `RunState` — 선택된 트리 필드; modify
  - `packages/contracts/src/save.ts` :: `RunSnapshotV1Schema` — 기존 V1 저장의 선택 필드 기본값; modify
  - `apps/web/src/game/state/createRunState.ts` :: `createRunState` — 기본 `null`; modify
  - `apps/web/src/game/systems/SaveSnapshotSystem.ts` :: `createSnapshot`, `restoreSnapshot` — 필드 왕복; modify
  - `apps/web/src/features/run/SaveResume.test.ts` :: 저장 왕복 테스트 — 기존 저장 및 진화 저장 검증; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export const WarriorEvolutionIdSchema = z.enum(['whirlwind', 'multi-sword', 'sword-wave', 'vanguard']);
  // RunState: warriorEvolutionId: z.infer<typeof WarriorEvolutionIdSchema> | null
  // RunSnapshotV1Schema: warriorEvolutionId: WarriorEvolutionIdSchema.nullable().default(null)
  ```
- **Data & Schema Fields**: `RunState.warriorEvolutionId`는 필수 필드이며 초기값 `null`; `RunSnapshotV1Schema.warriorEvolutionId`는 nullable, 누락 시 `null`로 변환. 저장 `schemaVersion: 1` 유지. 레벨업 강화 단계는 기존 `weaponLevels`/`upgradeStats`로 저장하므로 중복 필드를 만들지 않는다.
- **Execution Flow / Logic**:
  1. Precondition: 선택 이전에는 `null`, 선택 후에는 유효한 ID 하나.
  2. Core Processing: `createSnapshot`에서 ID를 기록하고 `restoreSnapshot`에서 읽는다. 기존 저장의 누락 필드는 스키마 기본값 `null`로 복구한다.
  3. Error: 알 수 없는 ID는 스키마에서 거부한다. 정상 저장 객체의 기존 필드 이름은 변경하지 않는다.
  4. State: 테스트에서 새 원정, V1 구형 저장, 네 트리 각각 저장·복원을 확인한다.

### I03. 전용 레벨업 강화 카탈로그
- Related Files:
  - `apps/web/src/game/content/upgrades.ts` :: `upgradeCatalog`, `getAvailableUpgrades` — 네 항목 추가 및 트리별 필터; modify
  - `apps/web/src/game/systems/LevelSystem.ts` :: `rollChoices` — 기본 카탈로그 필터와 주입 카탈로그 테스트 경로 정합성; modify
  - `apps/web/src/game/test/LevelSystem.test.ts` :: 트리 미선택·선택·최대 강화 검증; modify

#### Details
- **Signatures & Types**:
  ```typescript
  export function getAvailableUpgrades(characterId: CharacterId, state: RunState): UpgradeDefinition[];
  // warriorEvolutionUpgradeIds: Record<WarriorEvolutionId, string>
  ```
- **Data & Schema Fields**: 기존 `UpgradeDefinition` 사용. `whirlwind-damage` maxLevel 5, `values: [0.1,0.1,0.1,0.1,0.1]`, stat `whirlwind-damage-ratio`; `multi-sword-count` maxLevel 3, values `[1,1,1]`, stat `multi-sword-count`; `sword-wave-penetration` maxLevel 4, values `[1,1,1,1]`, stat `sword-wave-penetration`; `vanguard-heat` maxLevel 5, values `[2,2,2,2,2]`, stat `vanguard-heat-damage`. 모두 `appliesTo: 'weapon' | 'warrior'`의 기존 허용값, `characterIds: ['warrior']`, 기존 가중치 범위 내 6으로 한다. 이름은 각각 `승리를 위한 회전`, `N도류`, `검기 강화`, `뜨거운 열기`.
- **Execution Flow / Logic**:
  1. Precondition: 캐릭터가 전사이고 `state.warriorEvolutionId`가 해당 트리여야 전용 강화가 노출된다.
  2. Core: 일반 강화는 이전처럼 노출된다. 전용 강화의 단계가 `maxLevel`에 도달하면 제외한다. `LevelSystem.rollChoices`의 기본 카탈로그와 테스트 주입 카탈로그가 다른 경로여도 진화 강화의 트리 제한을 동일하게 적용한다.
  3. Error: 다른 캐릭터/다른 트리/미선택 상태에서는 전용 강화가 한 개도 노출되지 않는다.
  4. Return: 최대 3개의 중복 없는 유효한 레벨업 선택지.

## Acceptance Criteria
- [ ] 보스 보상 두 후보가 중복 없이 6조합 균등 추첨된다.
- [ ] 선택 ID는 저장·복원되고 구형 V1 저장은 `null`로 복구된다.
- [ ] 선택한 트리의 강화만 일반 레벨업 후보에 추가되며 최대 강화 후 제외된다.

## Validation
- `npm run build --workspace @caravan/contracts` — 스키마 및 타입 빌드 통과
- `npm run test --workspace @caravan/web -- WarriorEvolution.test.ts LevelSystem.test.ts SaveResume.test.ts` — 상태·추첨·저장 테스트 통과
- `npm run typecheck` — API·웹 타입 검사 통과

## Commit Message
```text
feat(game): define warrior evolution state and upgrade pool

Plan: 2026-11-17-caravan-warrior-five-minute-evolution
Phase: P01-warrior-evolution
Task: T01-evolution-state

- Persist the selected evolution in V1 run snapshots
- Add uniform two-choice rolls and tree-gated upgrades
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- commit: 이번 Task 커밋
