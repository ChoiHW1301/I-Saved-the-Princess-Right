import { describe, expect, it } from 'vitest';
import { bossTestScenarios, getBossTestScenario } from '../content/BossTestScenario.js';

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
});
