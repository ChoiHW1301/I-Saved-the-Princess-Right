# Phase: P01 Development Azure Deployment (Superseded)

This deployment target was replaced by `grill-me-edu`. See [the replacement plan](../../../plans/2026-10-27-caravan-grill-me-edu-deployment.md). Do not continue provisioning or deploying against `rg-caravan-game-dev`; clean up its game resources only after the replacement environment passes verification.

## Tasks
| Task | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| T01 | `done ✅` | Create the development resource group and provision the Bicep stack. | [T01](./T01-provision-resources.md) |
| T02 | `superseded` | Do not continue API deployment in the old group; the replacement plan uses `grill-me-edu`. | [T02](./T02-deploy-api.md) |
| T03 | `superseded` | Replaced by deployment of the new Free Static Web App in `grill-me-edu`. | [T03](./T03-deploy-web.md) |
| T04 | `superseded` | Live checks are defined in the replacement plan before old-stack cleanup. | [T04](./T04-live-verification.md) |

## Progress
- done: 1/4 (superseded; use the replacement plan)
