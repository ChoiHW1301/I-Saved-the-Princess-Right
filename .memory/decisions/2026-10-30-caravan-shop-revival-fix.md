# Decision: Caravan Shop Revival Fix

- The local Vite playtest endpoint returned HTTP 400 for `extra-lives`, confirming its in-memory upgrade catalog was older than the source catalog.
- Include `extra-lives` as the eleventh common upgrade card in the existing five-column grid.
- Add a yellow upward arrow overlay to the health-regeneration heart icon using CSS shapes.
- Persist local playtest profile, save, and leaderboard state in an ignored workspace file so refreshing the stale dev server does not erase local progress.
- Give `INVALID_UPGRADE` a specific message that points to an outdated API runtime.
