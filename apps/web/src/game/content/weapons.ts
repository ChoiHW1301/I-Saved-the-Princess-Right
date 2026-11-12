import { WeaponDefinitionSchema, type CharacterId, type WeaponDefinition } from '@caravan/contracts';
import { getCharacterDefinition } from './characters.js';

const definitions: WeaponDefinition[] = [
  { id: 'sword', owner: 'warrior', kind: 'melee', intervalMs: 1500, damage: 12, range: 125, projectileCount: 1, penetration: 0 },
  { id: 'bow', owner: 'archer', kind: 'projectile', intervalMs: 1000, damage: 10, range: 350, projectileCount: 1, penetration: 0 },
  { id: 'fireball', owner: 'mage', kind: 'spell', intervalMs: 880, damage: 15, range: 200, projectileCount: 1, penetration: 0, statusEffect: 'burn' },
  { id: 'ice-spear', owner: 'mage', kind: 'spell', intervalMs: 1050, damage: 9, range: 240, projectileCount: 1, penetration: 3 },
  { id: 'thunder', owner: 'mage', kind: 'spell', intervalMs: 1450, damage: 16, range: 190, projectileCount: 3, penetration: 0 },
  { id: 'gold-shotgun', owner: 'merchant', kind: 'spread', intervalMs: 760, damage: 7, range: 165, projectileCount: 3, penetration: 0, projectileSpread: 0.72 },
];

export const weaponCatalog: Readonly<Record<string, WeaponDefinition>> = Object.freeze(Object.fromEntries(
  definitions.map((definition) => [definition.id, WeaponDefinitionSchema.parse(definition)]),
));

export function getStartingWeaponId(characterId: CharacterId): string {
  const character = getCharacterDefinition(characterId);
  const weapon = weaponCatalog[character.startingWeaponId];
  if (!weapon || weapon.owner !== characterId) throw new RangeError(`Invalid starting weapon for ${characterId}.`);
  return weapon.id;
}
