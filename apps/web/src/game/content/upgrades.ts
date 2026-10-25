import type { UpgradeDefinition } from '@caravan/contracts';
import type { CharacterId, RunState } from '@caravan/contracts';

export const upgradeCatalog: readonly UpgradeDefinition[] = [
  { id: 'sword-damage', name: '날카로운 검', description: '검 공격 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'sword-damage', values: [4, 5, 6, 8, 10], weight: 10, characterIds: ['warrior'] },
  { id: 'sword-range', name: '크게 휘둘러라', description: '검 공격 범위 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'sword-range', values: [18, 22, 28, 35], weight: 8, characterIds: ['warrior'] },
  { id: 'warrior-regeneration', name: '들끓는 심장', description: '초당 체력을 0.2 회복합니다.', maxLevel: 5, appliesTo: 'warrior', stat: 'health-regeneration', values: [0.2, 0.2, 0.2, 0.2, 0.2], weight: 7, characterIds: ['warrior'] },
  { id: 'warrior-attack-speed', name: '수련의 성과', description: '공격 속도 15% 증가', maxLevel: 5, appliesTo: 'warrior', stat: 'attack-speed', values: [0.15, 0.15, 0.15, 0.15, 0.15], weight: 7, characterIds: ['warrior'] },
  { id: 'warrior-max-health', name: '강철의 맷집', description: '최대 체력과 현재 체력 증가', maxLevel: 5, appliesTo: 'warrior', stat: 'warrior-max-health', values: [20, 25, 30, 35, 40], weight: 8 },
  { id: 'warrior-reflect', name: '가시 갑옷', description: '피격 시 적에게 반사 피해', maxLevel: 5, appliesTo: 'warrior', stat: 'warrior-reflect', values: [2, 3, 4, 5, 7], weight: 6 },
  { id: 'movement-speed', name: '질풍의 발걸음', description: '이동 속도 증가', maxLevel: 4, appliesTo: 'warrior', stat: 'movement-speed', values: [18, 22, 26, 30], weight: 7 },
  { id: 'caravan-max-health', name: '마차 보강', description: '마차 최대 내구도 증가', maxLevel: 5, appliesTo: 'caravan', stat: 'caravan-max-health', values: [35, 40, 45, 50, 60], weight: 7 },

  { id: 'arrow-damage', name: '가시 화살촉', description: '화살 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'bow-damage', values: [3, 4, 5, 7, 9], weight: 8, characterIds: ['archer'] },
  { id: 'arrow-penetration', name: '관통 사격', description: '화살이 더 많은 적을 꿰뚫습니다.', maxLevel: 4, appliesTo: 'weapon', stat: 'bow-penetration', values: [1, 1, 2, 2], weight: 7, characterIds: ['archer'] },
  { id: 'arrow-range', name: '장궁', description: '화살 사거리 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'bow-range', values: [30, 40, 50, 65], weight: 6, characterIds: ['archer'] },
  { id: 'burn', name: '화염 화살', description: '화살이 지속 피해를 입힙니다.', maxLevel: 3, appliesTo: 'weapon', stat: 'bow-burn', values: [2, 3, 5], weight: 5, characterIds: ['archer'] },

  { id: 'fireball-damage', name: '타오르는 핵', description: '파이어볼 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'fireball-damage', values: [4, 5, 7, 9, 12], weight: 8, characterIds: ['mage'] },
  { id: 'fireball-size', name: '커지는 화염', description: '파이어볼의 크기와 영향 범위 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'fireball-size', values: [4, 6, 8, 12], weight: 6, characterIds: ['mage'] },
  { id: 'fireball-impact-area', name: '화염 장판', description: '파이어볼이 적중한 자리에 불길을 남깁니다.', maxLevel: 1, appliesTo: 'weapon', stat: 'fireball-impact-area', values: [48], weight: 4, characterIds: ['mage'] },
  { id: 'weak-copy', name: '잔불 복제', description: '약화된 파이어볼이 추가로 발사됩니다.', maxLevel: 1, appliesTo: 'weapon', stat: 'fireball-weak-copy', values: [0.45], weight: 4, characterIds: ['mage'] },
  { id: 'ice-spear', name: '아이스 스피어', description: '관통하는 얼음 마법을 추가합니다.', maxLevel: 1, appliesTo: 'weapon', stat: 'add-weapon:ice-spear', values: [1], weight: 3, characterIds: ['mage'] },
  { id: 'thunder', name: '체인 썬더', description: '여러 적을 공격하는 번개 마법을 추가합니다.', maxLevel: 1, appliesTo: 'weapon', stat: 'add-weapon:thunder', values: [1], weight: 3, characterIds: ['mage'] },

  { id: 'pellet-count', name: '추가 산탄', description: '한 번에 발사하는 골드 탄환 수 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'gold-shotgun-count', values: [1, 1, 2, 2], weight: 7, characterIds: ['merchant'] },
  { id: 'pellet-damage', name: '묵직한 금화', description: '탄환 피해 증가', maxLevel: 5, appliesTo: 'weapon', stat: 'gold-shotgun-damage', values: [2, 3, 4, 5, 7], weight: 8, characterIds: ['merchant'] },
  { id: 'pellet-range', name: '장거리 투척', description: '탄환 사거리 증가', maxLevel: 4, appliesTo: 'weapon', stat: 'gold-shotgun-range', values: [20, 28, 38, 50], weight: 6, characterIds: ['merchant'] },
  { id: 'spread-tightness', name: '집탄 강화', description: '탄환이 가까운 적에게 더 집중됩니다.', maxLevel: 4, appliesTo: 'weapon', stat: 'gold-shotgun-tightness', values: [0.12, 0.12, 0.12, 0.12], weight: 5, characterIds: ['merchant'] },
];

export function getAvailableUpgrades(characterId: CharacterId, state: RunState): UpgradeDefinition[] {
  return upgradeCatalog.filter((upgrade) => (upgrade.characterIds === undefined || upgrade.characterIds.includes(characterId))
    && (state.weaponLevels[upgrade.id] ?? 0) < upgrade.maxLevel);
}
