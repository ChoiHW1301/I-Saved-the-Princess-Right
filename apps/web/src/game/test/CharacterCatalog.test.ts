import { describe, expect, it } from 'vitest';
import { CharacterDefinitionSchema, WeaponDefinitionSchema } from '@caravan/contracts';
import { characterCatalog } from '../content/characters.js';
import { getAvailableUpgrades } from '../content/upgrades.js';
import { weaponCatalog } from '../content/weapons.js';
import { createRunState } from '../state/createRunState.js';
import { WeaponSystem } from '../systems/WeaponSystem.js';

describe('character and weapon catalogs', () => {
  it('validates four first-version characters with distinct starting weapons', () => {
    const roster = Object.values(characterCatalog);
    roster.forEach((character) => CharacterDefinitionSchema.parse(character));
    expect(roster.map(({ id, startingWeaponId }) => [id, startingWeaponId])).toEqual([
      ['hero', 'sword'], ['archer', 'bow'], ['mage', 'fireball'], ['merchant', 'gold-shotgun'],
    ]);
    Object.values(weaponCatalog).forEach((weapon) => WeaponDefinitionSchema.parse(weapon));
    expect(() => createRunState('dark-hero')).toThrow('Character is not available');
  });

  it('gives each class an exclusive upgrade pool and mage spell unlocks', () => {
    const ids = (characterId: 'hero' | 'archer' | 'mage' | 'merchant'): string[] =>
      getAvailableUpgrades(characterId, createRunState(characterId)).map(({ id }) => id);
    expect(ids('hero')).toContain('sword-wave');
    expect(ids('hero')).not.toContain('arrow-damage');
    expect(ids('archer')).toContain('arrow-penetration');
    expect(ids('mage')).toEqual(expect.arrayContaining(['fireball-size', 'ice-spear', 'thunder']));
    expect(ids('merchant')).toContain('spread-tightness');
  });

  it('adds only owner-matched catalog weapons and applies burn as damage over time', () => {
    const run = createRunState('mage');
    const weapons = new WeaponSystem();
    expect(weapons.addWeapon(run, 'ice-spear')).toBe(true);
    expect(weapons.addWeapon(run, 'bow')).toBe(false);
    const enemy = { hp: 100, maxHp: 100, dead: false, worldPosition: { x: 10, y: 0 } } as any;
    weapons.update(run, { x: 0, y: 0 }, [enemy], 16, () => 1);
    const afterHit = enemy.hp;
    weapons.update(run, { x: 0, y: 0 }, [enemy], 600, () => 1);
    expect(enemy.hp).toBeLessThan(afterHit);
  });

  it('fires all three starting gold pellets even when they converge on one target', () => {
    const run = createRunState('merchant');
    const weapons = new WeaponSystem();
    const enemy = { hp: 100, maxHp: 100, dead: false, worldPosition: { x: 10, y: 0 } } as any;
    weapons.update(run, { x: 0, y: 0 }, [enemy], 16);
    expect(enemy.hp).toBeCloseTo(81.1);
  });
});
