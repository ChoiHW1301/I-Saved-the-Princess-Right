# Task: T03 점수·클리어 랭킹 UI

## Status: pending

## Goal
로그인한 DEX 직원에게 상위 10명 점수 랭킹과 캐릭터·카르마별 클리어 랭킹, 10위 밖일 때 본인 순위를 보여준다.

## Decision Summary
- 각 직원은 보드마다 최고 기록 한 건만 갖는다. 점수와 클리어 기록은 별도 보드다.
- 전체 기록은 순위 산출에 쓰되 공개 목록은 top 10, 하위 직원은 본인 순위만 확인한다.

## Implementation

### I01. Board selection, list and personal rank
- Related Files:
  - `apps/web/src/features/leaderboards/leaderboardApi.ts` :: `getScoreBoard`, `getClearBoard`; new
  - `apps/web/src/features/leaderboards/LeaderboardPage.tsx` :: `LeaderboardPage`; new
  - `apps/web/src/features/leaderboards/ScoreBoard.tsx` :: `ScoreBoard`; new
  - `apps/web/src/features/leaderboards/ClearBoard.tsx` :: `ClearBoard`; new
  - `apps/web/src/features/leaderboards/LeaderboardPage.test.tsx` :: board filtering and rank; new
- **Signatures & Types**:
  ```typescript
  export interface LeaderboardResponse { entries:LeaderboardEntry[]; myRank:number|null; totalEntries:number; }
  export function LeaderboardPage():JSX.Element;
  export async function getClearBoard(token:string, characterId:CharacterId, karmaTier:KarmaTier):Promise<LeaderboardResponse>;
  ```
- **Data & Schema Fields**: Score board query has no filter; clear board filter requires one `CharacterId` and one `KarmaTier`; list length 0..10; entry view uses `displayName`, score, elapsed seconds, character, karma, clear flag. Do not expose Entra email, tenant ID, object ID, or gold balance.
- **Execution Flow / Logic**: load score board by default; filter clear board by selected character/tier; use server order; if caller rank >10 show `내 순위: N위` without inserting into public top-ten list; empty board shows an empty state; refresh after `RunReceipt` board update.
- **Error & Exception Handling**: 401 sends user to sign-in; 403 shows access message; API outage has retry and preserves currently rendered cached list; invalid filter resets to defaults.

## Acceptance Criteria
- [ ] Both ranking modes are navigable
- [ ] Clear board can filter by character and karma tier
- [ ] Only top ten records and player’s own rank are shown
- [ ] No private identity fields are rendered

## Validation
- `npm run test --workspace apps/web -- src/features/leaderboards/LeaderboardPage.test.tsx` — top-ten, personal rank, filters, error states pass
- `npm run build --workspace apps/web` — board UI compiles

## Commit Message
```text
feat(leaderboard): add top-ten score and clear boards

Plan: 2026-10-21-caravan-escort-game
Phase: P04-account-ui
Task: T03-leaderboard-ui

- Add score and character-karma clear board views
- Show personal rank outside the public top ten
```

## Progress
- [ ] 구현 완료
- [ ] 검증 통과
- commit: pending
