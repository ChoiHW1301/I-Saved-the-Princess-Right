# Phase: P01 Static Site and Isolated API Stack

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done` | Adapt Bicep and infra checks for Free SWA with direct Function API calls and no elevated role assignment in the user deployment. | [T01](./T01-infra-template.md) |
| T02 | `done` | Validate and provision only new Caravan resources into the existing `grill-me-edu` group. | [T02](./T02-provision-grill-stack.md) |
| T03 | `in_progress` | Apply the Function identity's data roles and deploy/verify the API package. | [T03](./T03-deploy-api.md) |
| T04 | `pending` | Configure the existing DEX SPA redirect and deploy the React client to Free Static Web Apps. | [T04](./T04-deploy-web.md) |
| T05 | `pending` | Verify DEX sign-in, profile persistence, run save/resume, and leaderboard behavior. | [T05](./T05-live-verification.md) |
| T06 | `pending` | After successful verification, remove only the old Caravan game resources and obsolete redirect URI. | [T06](./T06-cleanup-old-stack.md) |

## Progress
- done: 2/6 (active: T03)
