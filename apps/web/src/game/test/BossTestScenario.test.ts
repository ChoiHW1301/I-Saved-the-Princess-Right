import { describe, expect, it } from 'vitest';
import { bossPostClearTestScenarios, bossTestScenarios, getBossPostClearTestScenario, getBossTestScenario } from '../content/BossTestScenario.js';
import { getBiomeAt } from '../systems/BiomeTransitionSystem.js';
import { campaignSchedule } from '../content/campaignSchedule.js';

describe('boss test scenario mapping', () => {
  it('maps all current bosses to their campaign start time and milestone', () => {
    expect(bossTestScenarios).toEqual([
      { bossId: 'lava-giant', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
      { bossId: 'lava-magician', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
      { bossId: 'castle-warlord', atSeconds: 600, milestoneId: 'castle-warlord-10min', kind: 'miniboss' },
      { bossId: 'forest-warden', atSeconds: 900, milestoneId: 'forest-warden', kind: 'miniboss' },
      { bossId: 'princess-demon', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
      { bossId: 'king-guard', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
    ]);
  });

  it('omits the legacy lava behemoth and rejects unknown IDs', () => {
    expect(bossTestScenarios.some(({ bossId }) => bossId === 'lava-behemoth')).toBe(false);
    expect(getBossTestScenario('lava-behemoth')).toBeUndefined();
    expect(getBossTestScenario('not-a-boss' as never)).toBeUndefined();
  });

  it('maps midboss clear starts to the next biome transition', () => {
    expect(bossPostClearTestScenarios).toEqual([
      { bossId: 'lava-giant', atSeconds: 300, milestoneId: 'lava-5min-slot', nextBiomeId: 'demon-castle', nextBiomeTitle: '어두운 폐허' },
      { bossId: 'lava-magician', atSeconds: 300, milestoneId: 'lava-5min-slot', nextBiomeId: 'demon-castle', nextBiomeTitle: '어두운 폐허' },
      { bossId: 'castle-warlord', atSeconds: 600, milestoneId: 'castle-warlord-10min', nextBiomeId: 'enchanted-forest', nextBiomeTitle: '숲' },
      { bossId: 'forest-warden', atSeconds: 900, milestoneId: 'forest-warden', nextBiomeId: 'meadow-village', nextBiomeTitle: '초원·마을' },
    ]);
    expect(getBossPostClearTestScenario('princess-demon')).toBeUndefined();
    expect(getBossPostClearTestScenario('not-a-boss' as never)).toBeUndefined();
    for (const scenario of bossPostClearTestScenarios) {
      const defeatedMilestones = campaignSchedule
        .filter((milestone) => milestone.kind !== 'event' && milestone.atSeconds <= scenario.atSeconds)
        .map((milestone) => milestone.id);
      expect(getBiomeAt(scenario.atSeconds, [], defeatedMilestones)).toEqual({
        from: scenario.atSeconds === 300 ? 'lava-fields' : scenario.atSeconds === 600 ? 'demon-castle' : 'enchanted-forest',
        to: scenario.nextBiomeId,
        progress: 0,
      });
    }
  });
});
