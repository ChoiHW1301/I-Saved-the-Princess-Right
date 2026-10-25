# Decisions: Caravan Gameplay and UI Polish

- Date: 2026-10-23
- Status: Confirmed
- Scope: Gameplay presentation, event encounters, combat progression, reward monster, and game UI polish.

## D01. Game viewport aspect ratio

- **Chosen**: Use a fixed 4:3 game composition. Scale the complete composition uniformly to fit the browser viewport and leave any unused space as margins. Do not add an aspect-ratio setting.
- **Rationale**: The game should retain one consistent play feel instead of changing its visible composition with the browser aspect ratio.

## D02. Caravan and road alignment

- **Chosen**: Keep the caravan at the center of the game screen and shift the background artwork so the road lane passes through that center.
- **Rationale**: The caravan should visibly travel on the road while remaining the fixed visual anchor.

## D03. Tutorial and unlock copy

- **Chosen**: Remove the informational instruction text at the lower-left of the game screen and remove explanatory copy about game mechanics and unlockable content wherever it appears in the game flow. Keep essential in-game HUD values and text needed to understand live choices.
- **Rationale**: The screen should not read like a tutorial or unlock checklist during play.

## D04. Visual direction for UI

- **Chosen**: Replace text-only presentation in the main screen, HUD, pause control, and pause interface with medieval-fantasy pixel-art panels and iconography. Keep readable numbers and choice labels in the existing DungGeunMo typeface. Use image assets for the interface elements and resource icons.
- **Rationale**: The interface should look like part of the game while keeping gameplay information legible.

## D05. Enemy death presentation

- **Chosen**: Give each monster type its own short pixel-art death animation. Play it at the enemy's death position without enlarging or fading the sprite.
- **Rationale**: Death should read as a monster-specific motion instead of the current generic dissolve effect.

## D06. Timed event encounters

- **Chosen**: Keep the existing event schedule at three-minute intervals. Spawn a visible encounter sprite on the road ahead of the caravan and move it toward the caravan. Normal combat and game time continue during its approach. Contact with the caravan triggers the event choice and pauses gameplay for the choice.
- **Content note**: Keep event narratives and reward details as placeholders for now; they will be revised separately.
- **Rationale**: Events should be visible encounters in the world rather than immediate pop-up dialogs.

## D07. Mini-boss warning

- **Chosen**: Show a horizontal banner near the upper center for the five seconds before each mini-boss, with the message `Warning!! 수상한 기운 접근합니다!`.
- **Rationale**: Give the player a clear, brief warning before the encounter.

## D08. Damage feedback

- **Chosen**: Make the red screen-edge damage effect substantially larger than its current size for both player and caravan damage.
- **Rationale**: Make incoming damage easier to notice during combat.

## D09. Regular monster difficulty progression

- **Chosen**: Begin gradually increasing regular-monster durability at 2 minutes 30 seconds. Without meaningful attack upgrades, some regular monsters should start surviving one hit during the early-to-mid portion of a run. Keep the opening period tuned for quick kills.
- **Rationale**: Preserve the fast early Vampire Survivors-style rhythm while allowing enemy durability to catch up with an unupgraded build.

## D10. Rare reward monster spawn rate

- **Chosen**: Add a reward monster to 5% of all enemy spawn rolls. Use the existing monster proportions for the other 95% of rolls.
- **Rationale**: Make it rare without changing the relative mix of current enemies.

## D11. Reward monster pickup drop

- **Chosen**: A reward monster drops exactly one pickup on death. Roll one of four rewards with equal 25% probability. The pickup stays on the ground for 30 seconds; during its final five seconds it blinks with increasing frequency. The player must touch the pickup to collect it.
- **Rewards**:
  - Gold: +10.
  - Experience: five times the ordinary monster XP value at that point in the run. With the current base ghoul value of 3 XP, this is 15 XP.
  - Player healing: restore 10% of maximum player health, capped at maximum health.
  - Caravan repair: restore 40 current caravan health, capped at maximum health; do not increase maximum health.
- **Rationale**: The rare monster creates a visible choice of one useful reward, and pickup collection asks the player to move to it.

## D12. Deferred event content

- **Chosen**: Do not redesign event narratives or their reward balance as part of this change. Focus this pass on the encounter's visible approach and contact-triggered activation.
- **Rationale**: Event content and rewards need a separate design pass.
