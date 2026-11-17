export type WarriorEvolutionId = 'whirlwind' | 'multi-sword' | 'sword-wave' | 'vanguard';
export interface WarriorEvolutionDefinition { id: WarriorEvolutionId; name: string; description: string; upgradeId: string }

export const warriorEvolutionCatalog: readonly WarriorEvolutionDefinition[] = [
  { id: 'whirlwind', name: '훨윈드', description: '회전하며 주변 적을 지속해서 공격합니다.', upgradeId: 'whirlwind-damage' },
  { id: 'multi-sword', name: 'N도류', description: '한 공격 주기마다 검을 연속으로 휘두릅니다.', upgradeId: 'multi-sword-count' },
  { id: 'sword-wave', name: '검기', description: '검을 휘두를 때 초승달 검기를 발사합니다.', upgradeId: 'sword-wave-penetration' },
  { id: 'vanguard', name: '선봉장', description: '체력과 회복을 강화하고 주변에 열기 피해를 줍니다.', upgradeId: 'vanguard-heat' },
];
export const warriorEvolutionUpgradeIds: Record<WarriorEvolutionId, string> = {
  whirlwind: 'whirlwind-damage', 'multi-sword': 'multi-sword-count',
  'sword-wave': 'sword-wave-penetration', vanguard: 'vanguard-heat',
};
const choicePairs: readonly (readonly [WarriorEvolutionId, WarriorEvolutionId])[] = [
  ['whirlwind', 'multi-sword'], ['whirlwind', 'sword-wave'], ['whirlwind', 'vanguard'],
  ['multi-sword', 'sword-wave'], ['multi-sword', 'vanguard'], ['sword-wave', 'vanguard'],
];
export function rollWarriorEvolutionChoices(random: () => number): readonly [WarriorEvolutionId, WarriorEvolutionId] {
  const value = random();
  const roll = Number.isFinite(value) ? Math.max(0, Math.min(0.999999999, value)) : 0;
  return choicePairs[Math.floor(roll * choicePairs.length)]!;
}
