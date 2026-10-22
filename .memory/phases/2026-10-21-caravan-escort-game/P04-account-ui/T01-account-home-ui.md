# Task: T01 로그인 후 홈·캐릭터 선택·영구 성장 화면

## Status: done

## Goal
로그인한 직원이 계정 골드·해금·저장 상태를 확인하고, 캐릭터를 선택하거나 영구 강화 후 새 판을 시작할 React 메뉴를 제공한다.

## Decision Summary
- 표시 이름은 검증된 Entra profile의 `name`을 사용한다. 닉네임 입력 기능은 만들지 않는다.
- 계정 상태는 API profile 응답을 단일 원본으로 사용한다.

## Implementation

### I01. 홈·캐릭터 선택·메타 상점 UI
- Related Files:
  - `apps/web/src/app/App.tsx` :: authenticated route layout; modify
  - `apps/web/src/features/home/HomePage.tsx` :: `HomePage` — gold, save, nav; new
  - `apps/web/src/features/characters/CharacterSelect.tsx` :: `CharacterSelect` — unlocked character; new
  - `apps/web/src/features/progression/MetaShop.tsx` :: `MetaShop` — permanent upgrades/passives; new
  - `apps/web/src/features/profile/useProfile.ts` :: `useProfile` — API query/cache; new
  - `apps/web/src/features/profile/profileApi.ts` :: `getProfile`, `purchaseUpgrade`; new
  - `apps/web/src/features/home/HomePage.test.tsx` :: profile and interaction tests; new
- **Signatures & Types**:
  ```typescript
  export function HomePage(): JSX.Element;
  export function CharacterSelect(props:{profile:PlayerProfile; onStart:(id:CharacterId)=>void}): JSX.Element;
  export function MetaShop(props:{profile:PlayerProfile; onPurchased:(profile:PlayerProfile)=>void}): JSX.Element;
  export async function getProfile(token:string):Promise<PlayerProfile>;
  ```
- **Data & Schema Fields**: Home renders `displayName`, `goldBalance`, unlocked character cards, `hasCurrentSave`, and actions Continue/New/Leaderboard. Character cards show name, starting attack, difficulty, and lock reason. Meta upgrade cards show current/max level, next cost, stat effect, and disabled state when locked, capped, or unaffordable.
- **Execution Flow / Logic**: acquire API token from T02 hook; load profile; load save existence; start command passes selected `CharacterId` to run controller. Purchase sends `{upgradeId,expectedProfileVersion}` and replaces cached profile with API response.
- **Error & Exception Handling**: loading/error/retry states; 401 returns to sign-in; 403 shows DEX employee access message; insufficient gold displays inline response and refreshes profile; never show raw server details.

### I02. Visual layout and keyboard/accessibility behavior
- Related Files:
  - `apps/web/src/styles/tokens.css` :: pixel palette/type/spacing; new
  - `apps/web/src/features/home/HomePage.css` :: responsive desktop layout; new
  - `apps/web/src/features/characters/CharacterSelect.css` :: selection states; new
- **Data & Schema Fields**: support logical 1280x720 game aspect and minimum desktop viewport 1024x640; responsive shell can scroll below minimum; buttons expose visible focus, labels, and disabled reason.
- **Execution Flow / Logic**: selection and shop usable by mouse and keyboard; selected character is visually distinct; all locked states include unlock requirement text.
- **Error & Exception Handling**: absent art uses CSS pixel silhouette placeholders; no hidden/zero-size interactive controls.

## Acceptance Criteria
- [x] Only unlocked characters can start a run
- [x] Home reflects API gold/profile/current-save state
- [x] Upgrade UI enforces API result and clearly shows cost/cap
- [x] Login/access errors have user-readable states

## Validation
- `npm run test --workspace apps/web -- src/features/home/HomePage.test.tsx` — locked/unlocked, purchase, retry states pass
- `npm run build --workspace apps/web` — home and character pages compile

## Commit Message
```text
feat(ui): add account home character select and meta shop

Plan: 2026-10-21-caravan-escort-game
Phase: P04-account-ui
Task: T01-account-home-ui

- Add profile-driven character selection and gold shop
- Add accessible home navigation and account error states
```

## Progress
- [x] 구현 완료
- [x] 검증 통과 (`npm run test --workspace apps/web -- src/features/home/HomePage.test.tsx`, `npm run build --workspace apps/web`)
- commit: recorded in Git history
