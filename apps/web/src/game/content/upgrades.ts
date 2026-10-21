import type { UpgradeDefinition } from '@caravan/contracts';

export const upgradeCatalog: readonly UpgradeDefinition[] = [
  { id: 'sword-damage', name: '날카로운 검', description: '검 공격 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'sword-damage', values: [4, 5, 6, 8, 10], weight: 10, characterIds: ['hero', 'dark-hero'] },
  { id: 'sword-range', name: '검풍 연마', description: '검 공격 거리 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'sword-range', values: [18, 22, 28, 35], weight: 8, characterIds: ['hero', 'dark-hero'] },
  { id: 'hero-max-health', name: '강철의 맷집', description: '최대 체력과 현재 체력 증가', maxLevel: 5, appliesTo: 'hero', stat: 'hero-max-health', values: [20, 25, 30, 35, 40], weight: 8 },
  { id: 'hero-reflect', name: '가시 갑옷', description: '피격 시 적에게 반사 피해', maxLevel: 5, appliesTo: 'hero', stat: 'hero-reflect', values: [2, 3, 4, 5, 7], weight: 6 },
  { id: 'movement-speed', name: '신속한 발걸음', description: '이동 속도 증가', maxLevel: 4, appliesTo: 'hero', stat: 'movement-speed', values: [18, 22, 26, 30], weight: 7 },
  { id: 'caravan-max-health', name: '튼튼한 마차', description: '마차 최대 내구도와 현재 내구도 증가', maxLevel: 5, appliesTo: 'caravan', stat: 'caravan-max-health', values: [35, 40, 45, 50, 60], weight: 7 },
  { id: 'projectile-damage', name: '마력 증폭', description: '투사체 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'projectile-damage', values: [4, 6, 8, 10, 12], weight: 5, characterIds: ['mage'] },
  { id: 'projectile-range', name: '탄도 확장', description: '투사체 사거리 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'projectile-range', values: [20, 25, 30, 40], weight: 5, characterIds: ['archer', 'mage', 'merchant'] },
];
