import type { CharacterDefinition, CharacterId } from '@caravan/contracts';

export const characterCatalog: Readonly<Record<Exclude<CharacterId, 'dark-warrior'>, CharacterDefinition>> = {
  warrior: {
    id: 'warrior', name: '전사', unlockRule: 'default', startingWeaponId: 'sword', beginner: true,
    baseStats: { maxHp: 100, speed: 220, damageMultiplier: 1 },
  },
  archer: {
    id: 'archer', name: '궁수', unlockRule: 'first-run', startingWeaponId: 'bow', beginner: false,
    baseStats: { maxHp: 90, speed: 245, damageMultiplier: 0.95 },
  },
  mage: {
    id: 'mage', name: '마법사', unlockRule: 'first-clear', startingWeaponId: 'fireball', beginner: false,
    baseStats: { maxHp: 82, speed: 210, damageMultiplier: 1.05 },
  },
  merchant: {
    id: 'merchant', name: '상인', unlockRule: 'shop-purchase', startingWeaponId: 'gold-shotgun', beginner: false,
    baseStats: { maxHp: 95, speed: 215, damageMultiplier: 0.9 },
  },
};

export function getCharacterDefinition(id: CharacterId): CharacterDefinition {
  const definition = characterCatalog[id as keyof typeof characterCatalog];
  if (!definition) throw new RangeError(`Character is not available in this campaign: ${id}`);
  return definition;
}
