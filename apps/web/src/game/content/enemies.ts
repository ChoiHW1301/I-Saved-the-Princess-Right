export type EnemyTarget = 'hero' | 'caravan';

export interface EnemyDefinition {
  id: string;
  maxHp: number;
  speed: number;
  damage: number;
  attackRange: number;
  targetPolicy: 'nearest' | 'caravan-priority';
  wagonPriority: boolean;
  experience: number;
  gold: number;
  color: number;
}

const basic: EnemyDefinition = {
  id: 'keep-ghoul', maxHp: 20, speed: 60, damage: 9, attackRange: 34,
  targetPolicy: 'nearest', wagonPriority: false, experience: 3, gold: 1, color: 0x82a079,
};

export const enemyCatalog: readonly EnemyDefinition[] = [
  basic,
  { ...basic, id: 'wagon-rusher', maxHp: Math.round(basic.maxHp * 0.35), speed: 105, damage: 14,
    attackRange: 42, targetPolicy: 'caravan-priority', wagonPriority: true, experience: 5, gold: 2, color: 0xd78452 },
];
