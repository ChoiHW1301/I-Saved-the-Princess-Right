# Decisions: Caravan Survival and Gameplay Adjustments

- Date: 2026-10-30
- Status: Confirmed with noted defaults

## D01. Road alignment
- **Chosen**: Shift the terrain background downward by increasing `ROAD_VERTICAL_OFFSET` from 34 to 84 world pixels; keep the wagon and 4:3 view fixed.
- **Rationale**: The road is visually above the wagon in the provided play screenshot.

## D02. Warrior basic attack speed
- **Chosen**: Set the sword interval to 1500 ms (about 0.67 attacks per second), down from 1250 ms / 0.8 attacks per second.
- **Rationale**: The user chose option 1 from the offered rates.

## D03. HUD and pause button
- **Chosen**: Shorten the top HUD background so it ends around screen x=880 and leaves a visible gap before the pause button at the upper right. Keep the existing HUD values and pause button positions.
- **Rationale**: The current full-width HUD panel visually collides with the pause button.

## D04. Caravan collision for enemies
- **Chosen**: Treat the existing 224×72 caravan collision rectangle as an obstacle for monsters as well as the player. Wagon-targeting monsters stop outside its collision boundary and can attack from their attack range measured from that boundary. Monsters targeting the player route around the wagon instead of crossing through it.
- **Rationale**: Monsters should not visually or physically pass through the caravan while retaining their target behavior.

## D05. Death and shop revives
- **Chosen (default proposed after no reply)**: A new run begins with zero revives. Add a permanent three-rank shop upgrade; each purchased rank adds one revive charge per run, up to three. Use the existing first three common upgrade prices: 100, 125, and 150 G. When a charge is available, death consumes one and starts a five-second countdown. With no charges, death ends the run immediately. Revival restores full health and retains the existing two seconds of invulnerability.
- **Rationale**: This makes the user's “initially 0 revives” and three-stage shop upgrade concrete. The recommendation was presented for confirmation, but no reply arrived before work continued.

## D06. Revive countdown HUD
- **Chosen**: Show a compact integer-seconds revive countdown directly below the karma gauge while the player is dead and a revive is pending; hide it otherwise. Save and restore remaining revive charges and the active countdown.
- **Rationale**: The countdown should remain near the requested top-center karma display and survive temporary saves.

## Codebase Notes
- The sword currently attacks every 1250 ms. The terrain offset is 34. The HUD panel spans nearly the full view while the pause button is a separate React overlay.
- The player already collides with a static 224×72 rectangle. Enemies move manually in `EnemyDirector` and currently have no Arcade bodies; collision must therefore be handled by movement/target geometry rather than adding an ineffective collider to body-less enemies.
- Revive timing currently lives in `HealthSystem`/`RespawnSystem`. Player run state and saved run snapshots need a remaining-revive counter for deterministic resume behavior.
