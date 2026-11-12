export type EnemyTarget = 'warrior' | 'caravan';

export interface EnemyDefinition {
  id: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  targetPolicy: 'warrior-priority' | 'nearest' | 'caravan-priority';
  wagonPriority: boolean;
  flying?: boolean;
  experience: number;
  gold: number;
  color: number;
  rewardMonster?: boolean;
}

const basic: EnemyDefinition = {
  id: 'keep-ghoul', maxHp: 10, speed: 60, damage: 9, attackRange: 34,
  targetPolicy: 'warrior-priority', wagonPriority: false, experience: 3, gold: 1, color: 0x82a079,
};

export const enemyCatalog: readonly EnemyDefinition[] = [
  basic,
  { ...basic, id: 'imp', maxHp: 8, speed: 132, damage: 12, attackRange: 38,
    targetPolicy: 'caravan-priority', wagonPriority: true, flying: true, experience: 4, gold: 2, color: 0x9de5f2 },
  { ...basic, id: 'golden-imp', maxHp: 20, speed: 72, damage: 8, attackRange: 34,
    targetPolicy: 'warrior-priority', wagonPriority: false, experience: 0, gold: 0, color: 0xffd34e, rewardMonster: true },
];
