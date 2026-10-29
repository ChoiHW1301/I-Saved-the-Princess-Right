# Plan: Caravan Shop Upgrades

## Goal
Replace the current small set of permanent upgrades and shared passives with ten shared five-rank upgrades and per-character training. Persist purchases through the existing profile API, display them in the shop with pixel icons, and apply the confirmed effects during new and resumed runs.

## Confirmed requirements
- Shared upgrade rank costs are 100, 125, 150, 175, and 200 G. Per-rank effects: damage +5%; critical chance +2 percentage points; movement speed +6; attack speed +10%; player max HP +10; regeneration +0.2 HP/sec; wagon max HP +20; XP +5%; gold +5%; damage received reduced by 2%.
- Training belongs to each character. Warrior has five-rank Thorn Armor (reflect 5% of raw incoming damage per rank); Archer has a 500 G Dash unlock (160 px/0.25 sec, invulnerable during dash, 4 sec cooldown); Mage has a 500 G Wind Spirit's Blessing unlock (200 px radius, no damage, regular enemies full knockback, midbosses half distance, final boss immune, 8 sec cooldown); Merchant has five-rank Money Bomb (40 base damage, 100 px radius, 3 sec fuse, 12 sec cooldown, +10% multiplicative damage and +10 px radius per rank; one player-pickup coin per damaged enemy, damage dealt / 20 rounded nearest with minimum 1 G, disappears after 3 sec and blinks for its final 2 sec).
- Keep the four existing base HP values except Merchant becomes 95. Keep old profile fields readable; there is no refund or historical shop-record migration.
- Add a shop character selector and fitting pixel icons. Keep locked characters hidden.

## Planning assumptions
- Critical hits deal twice normal damage. Chance is `min(100%, rank * 2%)`; roll independently for each direct attack hit, including Money Bomb. Damage-over-time ticks do not crit.
- Common upgrades affect all the user's unlocked characters. Defense applies only to damage taken by the player, not the wagon. XP and gold bonuses apply to each XP/gold award and round to the nearest integer per award.
- Preserve `passiveIds` in the profile contract as a deprecated compatibility field, but stop selling or applying the three old passives. Add a default-empty training-level map so existing profile documents remain readable without a migration.
- Active ability cooldowns, dash state, bomb fuse state, training ranks and dropped coins must survive manual saves and resume. Add defaulted snapshot fields to V1 so older V1 snapshots remain parseable.

## Phases
| Phase | Status | Summary | Blueprint |
| :--- | :--- | :--- | :--- |
| P01 | `in_progress` | Extend profile purchases, redesign the shop, apply shared stats, then implement per-character training and save/resume behavior. | [P01](../phases/2026-10-29-caravan-shop-upgrades/P01-shop-progression/phase.md) |

## Scope notes
- Existing profile purchase persistence is already implemented in the web client and API; this plan extends those endpoints and their profile schema rather than introducing a second storage mechanism.
- No implementation code is included in this planning phase.
