import { getXpToNextLevel, type RunState, type UpgradeChoice, type UpgradeDefinition } from '@caravan/contracts';
import { upgradeCatalog } from '../content/upgrades.js';

export interface AddExperienceResult { state: RunState; levelUps: number }

export class LevelSystem {
  constructor(private readonly random: () => number, private readonly catalog: readonly UpgradeDefinition[] = upgradeCatalog) {}

  addXp(state: RunState, amount: number): AddExperienceResult {
    if (!Number.isInteger(amount) || amount <= 0 || state.status !== 'active' || state.pausedBy !== 'none') {
      return { state, levelUps: 0 };
    }
    state.xp += amount;
    let levelUps = 0;
    while (state.xp >= state.xpToNext) {
      state.xp -= state.xpToNext;
      state.level += 1;
      state.xpToNext = getXpToNextLevel(state.level);
      levelUps += 1;
    }
    if (levelUps > 0) {
      state.pendingLevelUps += levelUps;
      this.presentNextChoice(state);
    }
    return { state, levelUps };
  }

  rollChoices(state: RunState): UpgradeChoice[] {
    const eligible = this.catalog.filter((upgrade) => {
      const currentLevel = state.weaponLevels[upgrade.id] ?? 0;
      return currentLevel < upgrade.maxLevel && (!upgrade.characterIds || upgrade.characterIds.includes(state.characterId));
    });
    const choices: UpgradeChoice[] = [];
    while (eligible.length > 0 && choices.length < 3) {
      const totalWeight = eligible.reduce((sum, item) => sum + item.weight, 0);
      let roll = Math.max(0, Math.min(0.999999999, this.random())) * totalWeight;
      let selectedIndex = eligible.length - 1;
      for (let index = 0; index < eligible.length; index += 1) {
        roll -= eligible[index]!.weight;
        if (roll < 0) { selectedIndex = index; break; }
      }
      const [upgrade] = eligible.splice(selectedIndex, 1);
      if (!upgrade) break;
      const nextLevel = (state.weaponLevels[upgrade.id] ?? 0) + 1;
      choices.push({ id: upgrade.id, nextLevel, value: upgrade.values[nextLevel - 1]! });
    }
    return choices;
  }

  applyChoice(state: RunState, upgradeId: string): boolean {
    if (state.pausedBy !== 'level-up' || state.pendingChoices.length === 0) return false;
    const choice = state.pendingChoices.find((candidate) => candidate.id === upgradeId);
    const upgrade = this.catalog.find((candidate) => candidate.id === upgradeId);
    if (!choice || !upgrade || choice.nextLevel !== (state.weaponLevels[upgradeId] ?? 0) + 1
      || choice.nextLevel > upgrade.maxLevel) return false;
    state.weaponLevels[upgradeId] = choice.nextLevel;
    state.selectedUpgradeIds.push(upgradeId);
    state.upgradeStats[upgrade.stat] = (state.upgradeStats[upgrade.stat] ?? 0) + choice.value;
    state.pendingChoices = [];
    state.pendingLevelUps = Math.max(0, state.pendingLevelUps - 1);
    state.pausedBy = 'none';
    return true;
  }

  presentNextChoice(state: RunState): UpgradeChoice[] {
    if (state.pendingLevelUps <= 0) return [];
    const choices = this.rollChoices(state);
    if (choices.length === 0) {
      state.pendingLevelUps = 0;
      state.pendingChoices = [];
      state.pausedBy = 'none';
      return [];
    }
    state.pendingChoices = choices;
    state.pausedBy = 'level-up';
    return choices;
  }
}
