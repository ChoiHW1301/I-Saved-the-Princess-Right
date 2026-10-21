import { getXpToNextLevel, type CharacterId, type RunState } from '@caravan/contracts';

let nextRunSequence = 1;

export function createRunState(characterId: CharacterId = 'hero'): RunState {
  const sequence = nextRunSequence++;
  return {
    runId: `local-run-${sequence}`, status: 'active', elapsedSeconds: 0, characterId,
    level: 1, xp: 0, xpToNext: getXpToNextLevel(1), karma: 0, runGold: 0, kills: 0,
    selectedUpgradeIds: [], weaponLevels: { sword: 1 }, eventChoiceIds: [], defeatedBossIds: [], pausedBy: 'none',
    player: { hp: 100, maxHp: 100, isDead: false, respawnMs: 0, invulnerableMs: 0 },
    caravan: { hp: 250, maxHp: 250 }, pendingChoices: [], pendingLevelUps: 0, upgradeStats: {},
  };
}
