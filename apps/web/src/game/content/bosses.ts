import type { BossId, KarmaTier } from '@caravan/contracts';

export interface BossAttackDefinition { id: string; damage: number; range: number; cooldownMs: number }
export interface BossDefinition {
  id: BossId;
  kind: 'miniboss' | 'princess-demon' | 'king-guard';
  maxHp: number;
  damage: number;
  attacks: readonly BossAttackDefinition[];
  color: number;
}

const melee = (damage: number): readonly BossAttackDefinition[] => [{ id: 'melee', damage, range: 52, cooldownMs: 900 }];
export const bossCatalog: Readonly<Record<BossId, BossDefinition>> = {
  'castle-warlord': { id: 'castle-warlord', kind: 'miniboss', maxHp: 180, damage: 18, attacks: melee(18), color: 0xa54848 },
  'lava-behemoth': { id: 'lava-behemoth', kind: 'miniboss', maxHp: 220, damage: 20, attacks: melee(20), color: 0xd46a3b },
  'forest-warden': { id: 'forest-warden', kind: 'miniboss', maxHp: 250, damage: 22, attacks: melee(22), color: 0x719e4b },
  'princess-demon': { id: 'princess-demon', kind: 'princess-demon', maxHp: 360, damage: 24, attacks: melee(24), color: 0x8d4f9e },
  'king-guard': { id: 'king-guard', kind: 'king-guard', maxHp: 360, damage: 24, attacks: melee(24), color: 0xc5b783 },
};

export interface SpecialBossRule { eventChoiceId: string; requiredKarmaTier?: KarmaTier; bossId: BossId; priority: number }
// Reserved for authored event-specific boss variants; the first campaign has no overrides.
export const specialBossRules: readonly SpecialBossRule[] = [];

export function chooseFinalBoss(tier: KarmaTier): 'princess-demon' | 'king-guard' {
  return tier === 'evil' ? 'king-guard' : 'princess-demon';
}
