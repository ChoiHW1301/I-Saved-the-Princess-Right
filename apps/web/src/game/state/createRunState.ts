import { getXpToNextLevel, type CharacterId, type RunState } from '@caravan/contracts';
import { getCharacterDefinition } from '../content/characters.js';
import { getStartingWeaponId } from '../content/weapons.js';

let nextRunSequence = 1;

export function createRunState(characterId: CharacterId = 'hero'): RunState {
  const sequence = nextRunSequence++;
  const character = getCharacterDefinition(characterId);
  const weaponId = getStartingWeaponId(characterId);
  return {
    runId: `local-run-${sequence}`, status: 'active', elapsedSeconds: 0, characterId,
    level: 1, xp: 0, xpToNext: getXpToNextLevel(1), karma: 0, runGold: 0, kills: 0,
    selectedUpgradeIds: [], weaponLevels: { [weaponId]: 1 }, equippedWeaponIds: [weaponId], eventChoiceIds: [], defeatedBossIds: [], pausedBy: 'none',
    player: { hp: character.baseStats.maxHp, maxHp: character.baseStats.maxHp, isDead: false, respawnMs: 0, invulnerableMs: 0 },
    caravan: { hp: 250, maxHp: 250 }, pendingChoices: [], pendingLevelUps: 0, upgradeStats: {},
  };
}
