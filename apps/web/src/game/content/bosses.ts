import type { BossId, KarmaTier } from '@caravan/contracts';

export interface BossAttackDefinition { id: string; damage: number; range: number; cooldownMs: number }
export interface BossDefinition {
  id: BossId;
  kind: 'miniboss' | 'princess-demon' | 'king-guard';
  maxHp: number;
  speed: number;
  damage: number;
  attacks: readonly BossAttackDefinition[];
  color: number;
}

const melee = (damage: number): readonly BossAttackDefinition[] => [{ id: 'melee', damage, range: 52, cooldownMs: 900 }];
export const bossCatalog: Readonly<Record<BossId, BossDefinition>> = {
  'castle-warlord': { id: 'castle-warlord', kind: 'miniboss', maxHp: 180, speed: 42, damage: 18, attacks: melee(18), color: 0xa54848 },
  'lava-behemoth': { id: 'lava-behemoth', kind: 'miniboss', maxHp: 220, speed: 42, damage: 20, attacks: melee(20), color: 0xd46a3b },
  'lava-giant': { id: 'lava-giant', kind: 'miniboss', maxHp: 220, speed: 42, damage: 20, attacks: melee(20), color: 0xd46a3b },
  'lava-magician': { id: 'lava-magician', kind: 'miniboss', maxHp: 220, speed: 42, damage: 20, attacks: melee(20), color: 0xe18a46 },
  'forest-warden': { id: 'forest-warden', kind: 'miniboss', maxHp: 250, speed: 42, damage: 22, attacks: melee(22), color: 0x719e4b },
  'princess-demon': { id: 'princess-demon', kind: 'princess-demon', maxHp: 360, speed: 48, damage: 24, attacks: melee(24), color: 0x8d4f9e },
  'king-guard': { id: 'king-guard', kind: 'king-guard', maxHp: 360, speed: 48, damage: 24, attacks: melee(24), color: 0xc5b783 },
};

export const bossDisplayName: Readonly<Record<BossId, string>> = {
  'castle-warlord': '성채 장군',
  'lava-behemoth': '용암 거인',
  'lava-giant': '용암 거인',
  'lava-magician': '라바 매지션',
  'forest-warden': '숲의 수호자',
  'princess-demon': '빙의된 공주',
  'king-guard': '왕과 근위병',
};

export interface SpecialBossRule { eventChoiceId: string; requiredKarmaTier?: KarmaTier; bossId: BossId; priority: number }
// Reserved for authored event-specific boss variants; the first campaign has no overrides.
export const specialBossRules: readonly SpecialBossRule[] = [];

export function chooseFinalBoss(tier: KarmaTier): 'princess-demon' | 'king-guard' {
  return tier === 'evil' ? 'king-guard' : 'princess-demon';
}

export function chooseLavaBoss(random: () => number): 'lava-giant' | 'lava-magician' {
  return random() < 0.5 ? 'lava-giant' : 'lava-magician';
}
