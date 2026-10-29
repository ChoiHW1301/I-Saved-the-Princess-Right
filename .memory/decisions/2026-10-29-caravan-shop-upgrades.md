# Decisions: Caravan Shop Upgrades and Character Training

- Date: 2026-10-29
- Status: Confirmed

## D01. Shop organization and character selection
- **Chosen**: Replace the existing common shop upgrades with shared upgrades available to every character. Put character-specific training in a separate section. Add a character selector to the shop; training levels and unlocks belong to each character and only affect that character.
- **Rationale**: Common growth can benefit the whole roster while each character keeps its own identity and progression.
- **Display**: Use distinct fitting pixel icons and the existing warm pixel-fantasy card UI. Keep locked characters hidden, consistent with the existing character selection rule.

## D02. Common upgrades
- **Chosen**: All common upgrades have five ranks. The rank costs are 100, 125, 150, 175, and 200 G, in that order.
- **Effects per rank**:
  - Damage: +5%.
  - Critical chance: +2 percentage points.
  - Movement speed: +6.
  - Attack speed: +10%.
  - Player maximum HP: +10.
  - HP regeneration: +0.2 HP/sec.
  - Wagon maximum HP: +20.
  - XP gain: +5%.
  - Gold gain: +5%.
  - Defense: reduce damage received by 2%.
- **Rationale**: The duplicate movement-speed entry in the initial list is replaced by wagon maximum HP; defense is also included as requested.

## D03. Character base health and existing training replacement
- **Chosen**: Character base maximum HP is Warrior 100, Archer 90, Mage 82, and Merchant 95. Replace the existing character passives with the training entries below. Maximum-HP common upgrades add +10 maximum HP per rank.
- **Rationale**: Merchant's base maximum HP is specifically reduced from 105 to 95; the other characters retain their current base values.

## D04. Training types and prices
- **Chosen**: Character training has two types: one-time special ability unlocks and five-rank upgrades. An ability unlock costs 500 G once. Five-rank upgrades use the same 100/125/150/175/200 G rank costs as common upgrades.
- **Chosen**: Start with one training per character, with room to add more later. Warrior's thorn armor and Merchant's money bomb are rank upgrades; Archer's dash and Mage's wind spirit blessing are ability unlocks.
- **Rationale**: This establishes both training patterns without requiring a full ability roster immediately.

## D05. Warrior: Thorn Armor
- **Chosen**: Five-rank upgrade. Reflect 5% of incoming damage per rank, up to 25% at rank five.
- **Chosen**: Calculate reflection from incoming damage before defense mitigation.
- **Rationale**: The reflection amount scales directly with the purchased rank and remains distinct from defense.

## D06. Archer: Dash
- **Chosen**: Unlock for 500 G. Space activates a dash in the current movement direction; if stationary, use the last movement direction, defaulting to right before the first movement. Dash distance is about 160 px over 0.25 sec, with invulnerability during the dash. Cooldown is 4 sec.
- **Rationale**: The ability remains usable while stationary and has a defined initial direction.

## D07. Mage: Wind Spirit's Blessing
- **Chosen**: Unlock for 500 G. Space pushes enemies away from the mage until they are outside a 200 px radius, with no damage. Regular enemies receive full knockback, midbosses receive half-distance knockback, and the final boss is immune. Cooldown is 8 sec.
- **Rationale**: The ability provides crowd control while preserving boss resistance.

## D08. Merchant: Money Bomb
- **Chosen**: Five-rank upgrade. Space places a bomb at the merchant's feet. It explodes after 3 sec; the cooldown begins on placement and lasts 12 sec. Rank one deals 40 damage in a 100 px radius. Each rank adds 10% damage multiplicatively and 10 px radius, reaching about 59 damage and 140 px at rank five.
- **Chosen**: Each enemy hit drops one coin at that enemy's position. Coin value is the damage dealt divided by 20, rounded to the nearest whole G, with a minimum value of 1 G. The player must touch a coin to collect it. Coins disappear after 3 sec and blink during the final 2 sec.
- **Rationale**: This follows the confirmed bomb timing, damage scaling, coin valuation correction, and pickup behavior.

## D09. XP and gold bonus rounding
- **Chosen**: Round boosted XP and gold amounts to the nearest whole number for each reward, as selected in the interview (option 2).
- **Rationale**: The current XP system accepts integer amounts, and saved run gold is an integer.

## D10. Persistence and migration
- **Chosen**: No migration or refund path is needed for previous shop records because persistent game records have not been implemented yet.
- **Rationale**: The new shop can replace the current local progression model without carrying forward stored purchase data.

## D11. Implementation boundary
- **Chosen**: This file records requirements only. Create the implementation plan in the memory-plan phase before changing application code.
- **Rationale**: Follows the repository's interview → plan → sequential execution workflow.

## Implementation notes inferred from the confirmed choices
- Apply common damage, critical chance, and attack-speed stats to the character's damage sources, including the Merchant's bomb; do not apply common player defense to wagon damage.
- Apply XP and gold bonuses to earned XP and gold, including pickups and reward drops. Round each awarded amount to the nearest integer.
- When a bomb damages multiple enemies, calculate each coin from the damage actually dealt to that enemy, and produce no coin for enemies outside the explosion or otherwise unharmed.
