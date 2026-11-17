# Task: T02 API test and release readiness

## Status: done

## Goal
Make the current API tests pass under the ranked training rules and prepare a Function deployment package without changing game behavior.

## Decision Summary
- `warrior-thorn-armor` is ranked to level 5 in `packages/contracts/src/metaProgression.ts`; an old API test incorrectly expects level 2 to fail.
- API package `main` already points to `dist/src/functions/index.js` and the repository has `scripts/deploy-api.ps1`.

## Implementation

### I01. Correct obsolete training assertion
- Related Files:
  - `apps/api/test/functions/profile-save.test.ts` :: `purchases character training once` — modify.
  - `apps/api/src/services/profileService.ts` :: `purchaseTraining` — read-only.
  - `packages/contracts/src/metaProgression.ts` :: `characterTrainingCatalog` — read-only.
- **Signatures & Types**: test remains a Vitest `it`; `purchaseTraining` request fields are `characterId`, `trainingId`, `expectedProfileVersion`.
- **Data & Schema Fields**: `warrior-thorn-armor` `kind='ranked'`, `maxLevel=5`, costs `[100,125,150,175,200]`; profile `version`, `goldBalance`, `characterTrainingLevels.warrior`.
- **Execution Flow / Logic**: assert the second purchase with version 2 succeeds, reaches rank 2 and deducts 125G; preserve first purchase assertions. No production training change.

### I02. Package dry run
- Related Files:
  - `scripts/deploy-api.ps1` :: `PackageOnly` — execute, modify only if packaging fails.
  - `apps/api/package.json` :: `main` — read-only verification.
- Run API suite, root typecheck, API build, and package-only script. Keep generated package under OS temp and do not commit it.

## Acceptance Criteria
- [x] All API tests pass; ranked training purchase can advance to rank 2.
- [x] API package builds with the expected Functions entry module.

## Validation
- `npm run test --workspace @caravan/api` — all tests pass.
- `npm run typecheck` — all workspaces pass.
- `./scripts/deploy-api.ps1 -ResourceGroup grill-me-edu -FunctionAppName caravan-grill-api-e21002 -PackageOnly` — package created.

## Commit Message
```text
test(api): align ranked training release check

Plan: 2026-11-17-caravan-shared-cosmos-persistence
Phase: P01-azure-connection
Task: T02-api-readiness

- Assert the second thorn armor purchase advances its rank
- Verify the API package before cloud deployment
```

## Progress
- [x] 구현 완료
- [x] 검증 통과
- Packaging note: `Compress-Archive` stalled on roughly 13,000 npm files; switched to Windows bsdtar ZIP creation. Verified `host.json`, `package.json`, and `dist/src/functions/index.js` are at the archive root.
- commit: pending
