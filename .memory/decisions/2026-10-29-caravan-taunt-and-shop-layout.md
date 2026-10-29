# Decisions: Caravan Taunt and Shop Layout

- Date: 2026-10-29
- Status: Confirmed

## D01. Monster sprite facing
- **Chosen**: Flip every enemy sprite horizontally to face its horizontal movement direction. Keep its last facing when it is stationary or moving vertically.
- **Rationale**: The sprite should visually follow the direction the enemy is actually moving.

## D02. Warrior Taunt training
- **Chosen**: Add Taunt as a separate Warrior training alongside Thorn Armor. It costs 500 G once and is a passive ability.
- **Rationale**: Thorn Armor remains available, while Taunt becomes another character-specific training that can coexist with future entries.

## D03. Taunt range and target behavior
- **Chosen**: Taunt has a 300 px radius centered on the Warrior. Show a high-transparency yellow circle to visualize the radius once Taunt is unlocked. Wagon-priority enemies inside the circle target the Warrior; when they leave the circle, they resume their original wagon-priority behavior. Apply this to existing and newly spawned enemies, using the existing 250 ms target refresh. When the Warrior is dead, existing behavior sends enemies to the wagon.
- **Rationale**: This gives a visible, local protection zone without permanently changing enemy target policy.

## D04. Common-upgrade grid
- **Chosen**: Keep all ten common upgrades in five columns by two rows at every viewport width. Scale cards and their contents to available width while preserving image and UI proportions; do not switch to fewer columns or horizontal scrolling.
- **Rationale**: The requested 5×2 shop layout remains consistent, with the whole UI shrinking responsively.

## D05. Multiple character trainings and alignment
- **Chosen**: Show every training entry for the selected unlocked character. Structure the data and UI for additional training entries per character. For unlock-type cards without a rank progress bar, reserve a spacer with the same height as the rank bar so corresponding text and controls align.
- **Rationale**: Warrior now has Thorn Armor and Taunt, and the shop should accommodate the planned set of up to three trainings per character.

## D06. Existing shop and gameplay conventions
- **Chosen**: Keep existing training prices and behaviors unchanged; Taunt is an unlock-type training at 500 G. Leave other characters' current training entries as they are.
- **Rationale**: The request adds Taunt and presentation changes without adjusting other character designs.
