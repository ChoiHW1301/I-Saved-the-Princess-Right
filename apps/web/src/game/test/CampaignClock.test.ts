import { describe, expect, it } from 'vitest';
import { campaignSchedule } from '../content/campaignSchedule.js';
import { getBiomeAt } from '../systems/BiomeTransitionSystem.js';
import { CampaignClock } from '../systems/CampaignClock.js';

describe('campaign clock and biome schedule', () => {
  it('emits each scheduled milestone once at its exact campaign time', () => {
    const clock = new CampaignClock();
    expect(clock.update(179_900)).toEqual([]);
    expect(clock.update(100)).toEqual([campaignSchedule[0]]);
    expect(clock.elapsedSeconds).toBe(180);
    clock.pause('event:wounded-messenger');
    expect(clock.update(60_000)).toEqual([]);
    expect(clock.elapsedSeconds).toBe(180);
    expect(clock.resume('event:wrong-event')).toBe(false);
    expect(clock.resume('event:wounded-messenger')).toBe(true);
    expect(clock.update(120_000)).toEqual([campaignSchedule[1]]);
    expect(clock.hasEmitted('wounded-messenger')).toBe(true);
  });
  it('ignores negative and non-finite frame deltas', () => {
    const clock = new CampaignClock();
    expect(clock.update(-5)).toEqual([]);
    expect(clock.update(Number.NaN)).toEqual([]);
    expect(clock.elapsedSeconds).toBe(0);
  });
  it('fires all campaign milestones in order without repeats across pauses', () => {
    const clock = new CampaignClock();
    const fired: string[] = [];
    for (const milestone of campaignSchedule) {
      while (clock.elapsedSeconds < milestone.atSeconds) {
        const due = clock.update((milestone.atSeconds - clock.elapsedSeconds) * 1000);
        if (due.length > 0) {
          fired.push(due[0]!.id);
          clock.pause(`milestone:${due[0]!.id}`);
          expect(clock.update(5000)).toEqual([]);
          expect(clock.resume(`milestone:${due[0]!.id}`)).toBe(true);
        }
      }
      if (!clock.hasEmitted(milestone.id)) {
        const due = clock.update(0.1);
        if (due.length > 0) fired.push(due[0]!.id);
      }
    }
    expect(fired).toEqual(campaignSchedule.map(({ id }) => id));
  });
  it('keeps each biome until its miniboss falls, then crossfades over 30 seconds', () => {
    expect(getBiomeAt(0)).toEqual({ from: 'lava-fields', to: 'lava-fields', progress: 1 });
    expect(getBiomeAt(299)).toEqual({ from: 'lava-fields', to: 'lava-fields', progress: 1 });
    expect(getBiomeAt(300)).toEqual({ from: 'lava-fields', to: 'lava-fields', progress: 1 });
    expect(getBiomeAt(300, ['castle-warlord'])).toEqual({ from: 'lava-fields', to: 'demon-castle', progress: 0 });
    expect(getBiomeAt(315, ['castle-warlord'])).toEqual({ from: 'lava-fields', to: 'demon-castle', progress: 0.5 });
    expect(getBiomeAt(330, ['castle-warlord'])).toEqual({ from: 'demon-castle', to: 'demon-castle', progress: 1 });
    expect(getBiomeAt(600, ['castle-warlord', 'lava-behemoth'])).toEqual({ from: 'demon-castle', to: 'enchanted-forest', progress: 0 });
    expect(getBiomeAt(630, ['castle-warlord', 'lava-behemoth'])).toEqual({ from: 'enchanted-forest', to: 'enchanted-forest', progress: 1 });
    expect(getBiomeAt(900, ['castle-warlord', 'lava-behemoth', 'forest-warden'])).toEqual({ from: 'enchanted-forest', to: 'meadow-village', progress: 0 });
    expect(getBiomeAt(930, ['castle-warlord', 'lava-behemoth', 'forest-warden'])).toEqual({ from: 'meadow-village', to: 'meadow-village', progress: 1 });
  });
});
