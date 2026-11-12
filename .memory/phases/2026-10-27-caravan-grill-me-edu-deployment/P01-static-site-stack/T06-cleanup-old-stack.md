# Task: T06 Clean Up the Previous Caravan Development Stack

## Status: pending

## Goal
After T05 succeeds, remove only the previous Caravan game resources from `rg-caravan-game-dev` and the obsolete Static Web App redirect URI so two game stacks do not continue generating duplicate costs.

## Decision Summary
- Do not run cleanup before the new environment passes T05.
- The current user's `hw.choi2@dexconsulting.net` identity cannot read `rg-caravan-game-dev`; its resource administrator must perform the cleanup.
- Never delete the `grill-me-edu` group or any resource within it as part of this task.

## Implementation

### I01. Inventory and confirm only old Caravan resources
- Related Files:
  - `infra/main.bicep` :: previous Caravan resource graph and tags — read-only.
  - Azure resource group `rg-caravan-game-dev` — inventory only until each target is confirmed.
- Details:
  - Ask an administrator with access to `rg-caravan-game-dev` to list all resources and deployment outputs before deletion.
  - Match only the Caravan stack by `application=caravan-escort-game` and `environment=dev` tags and known names: old Static Web App `caravan-game-102790`, Function `caravan-api-dev-102790`, successful Cosmos `caravandb102791`, failed Cosmos `caravandb102790`, Storage `caravanstg102790`, App Insights `appi-dev-advvpf6vj6jre`, Log Analytics `law-dev-advvpf6vj6jre`, and the associated Function plan/deployment resources.
  - If any resource is untagged, shared, or cannot be positively matched, do not delete it; request owner confirmation.
  - Preserve `rg-caravan-game-dev` itself. Do not use `az group delete`.

### I02. Delete matched resources and remove stale redirect
- Related Files:
  - Azure resources listed in I01 — delete only after explicit inventory confirmation by the resource administrator.
  - Entra app registration `Caravan Escort Web` :: SPA redirect URI list — remove only `https://black-sea-092d93e00.3.azurestaticapps.net/` after the new origin is verified.
- Details:
  - Delete only the old Caravan resources confirmed in I01. Delete failed Cosmos resource state as well as successful deployed resources if Azure permits deletion.
  - Retain all unrelated assets and the old resource group. Do not remove API scope consent or `CaravanGame.Player` employee-group assignment.
  - Remove the old SWA redirect URI, keep localhost and the new `grill-me-edu` SWA URI, and verify the new site still signs in.
  - Record the administrator's deletion confirmation and before/after resource inventory without recording secrets.

## Acceptance Criteria
- [ ] T05 live sign-in and persistence checks passed before cleanup began.
- [ ] Only confirmed Caravan game resources in `rg-caravan-game-dev` were deleted; the group and unrelated resources remain.
- [ ] The old SWA redirect URI is removed; the new SWA and localhost URIs remain.
- [ ] No duplicate old Caravan stack resources remain to accrue ongoing charges.

## Validation
- `az resource list --resource-group rg-caravan-game-dev --query "[?tags.application=='caravan-escort-game'].{name:name,type:type}" -o table` as the resource administrator — expected no old game stack resources after cleanup (or only explicitly retained resources documented with owner approval).
- `az resource list --resource-group grill-me-edu --query "[].{name:name,type:type}" -o table` as `hw.choi2@dexconsulting.net` — expected all unrelated group assets and the new Caravan stack remain.
- Browser sign-in at the new SWA origin after removing the old redirect — expected success.

## Commit Message
```text
ops(azure): retire previous Caravan dev resources

Plan: 2026-10-27-caravan-grill-me-edu-deployment
Phase: P01-static-site-stack
Task: T06-cleanup-old-stack

- Remove only verified old Caravan resources after migration
- Keep unrelated resource-group assets and Entra roles intact
```

## Progress
- [ ] Implementation complete
- [ ] Validation passed
- commit: pending
