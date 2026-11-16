import { describe, expect, it } from 'vitest';
import { campaignSchedule } from '../content/campaignSchedule.js';
import { getBiomeAt } from '../systems/BiomeTransitionSystem.js';
import { CampaignClock } from '../systems/CampaignClock.js';
import { getRestoredMilestoneId, migrateDefeatedMilestoneIds } from '../systems/CampaignProgressMigration.js';
import { RunSnapshotV1Schema } from '@caravan/contracts';

describe('campaign clock and biome schedule', () => {
  it('places the randomized lava slot at five minutes and preserves the later boss slots', () => {
    expect(campaignSchedule.filter(({ kind }) => kind !== 'event').map(({ atSeconds, kind, id, bossId }) => ({ atSeconds, kind, id, bossId }))).toEqual([
      { atSeconds: 300, kind: 'miniboss', id: 'lava-5min-slot', bossId: undefined },
      { atSeconds: 600, kind: 'miniboss', id: 'castle-warlord-10min', bossId: 'castle-warlord' },
      { atSeconds: 900, kind: 'miniboss', id: 'forest-warden', bossId: 'forest-warden' },
      { atSeconds: 1200, kind: 'final-boss', id: 'princess-demon', bossId: undefined },
    ]);
  });
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
    expect(getBiomeAt(300, [], ['lava-5min-slot'])).toEqual({ from: 'lava-fields', to: 'demon-castle', progress: 0 });
    expect(getBiomeAt(315, [], ['lava-5min-slot'])).toEqual({ from: 'lava-fields', to: 'demon-castle', progress: 0.5 });
    expect(getBiomeAt(330, [], ['lava-5min-slot'])).toEqual({ from: 'demon-castle', to: 'demon-castle', progress: 1 });
    expect(getBiomeAt(600, [], ['lava-5min-slot'])).toEqual({ from: 'demon-castle', to: 'demon-castle', progress: 1 });
    expect(getBiomeAt(600, [], ['lava-5min-slot', 'castle-warlord-10min'])).toEqual({ from: 'demon-castle', to: 'enchanted-forest', progress: 0 });
    expect(getBiomeAt(630, [], ['lava-5min-slot', 'castle-warlord-10min'])).toEqual({ from: 'enchanted-forest', to: 'enchanted-forest', progress: 1 });
    expect(getBiomeAt(900, [], ['lava-5min-slot', 'castle-warlord-10min'])).toEqual({ from: 'enchanted-forest', to: 'enchanted-forest', progress: 1 });
    expect(getBiomeAt(900, [], ['lava-5min-slot', 'castle-warlord-10min', 'forest-warden'])).toEqual({ from: 'enchanted-forest', to: 'meadow-village', progress: 0 });
    expect(getBiomeAt(930, [], ['lava-5min-slot', 'castle-warlord-10min', 'forest-warden'])).toEqual({ from: 'meadow-village', to: 'meadow-village', progress: 1 });
  });
  it('migrates old boss completion and active-boss IDs into their replacement slots', () => {
    const base = {
      characterId: 'warrior', worldWidth: 1280, roadCenterY: 267, stageId: 'lava-fields', rngSeed: 4, karma: 0, status: 'active' as const,
      pendingEventId: null, eventChoiceIds: [], ordinarySpawnCooldownMs: 100, activeBoss: null,
      player: { x: 0, y: 0, hp: 100, maxHp: 100, level: 1, xp: 0, xpToNext: 10, respawnMs: 0, respawnsRemaining: 0, invulnerableMs: 0 },
      wagon: { hp: 100, maxHp: 100 }, runGold: 0, kills: 0, pendingLevelUps: 0, pendingChoices: [], weaponLevels: { sword: 1 },
      upgradeStats: {}, trainingLevels: {}, activeAbilityCooldownMs: 0, dashRemainingMs: 0, dashDirection: { x: 1, y: 0 }, upgradeIds: [],
      defeatedBossIds: [], enemies: [], projectiles: [],
    };
    const legacyCompleted = RunSnapshotV1Schema.parse({ ...base, elapsedSeconds: 620, defeatedBossIds: ['castle-warlord', 'lava-behemoth'] });
    expect(migrateDefeatedMilestoneIds(legacyCompleted)).toEqual(['lava-5min-slot', 'castle-warlord-10min']);
    const legacyActiveFive = RunSnapshotV1Schema.parse({ ...base, elapsedSeconds: 300, activeBoss: { id: 'castle-warlord', typeId: 'castle-warlord', hp: 90, maxHp: 180 } });
    expect(getRestoredMilestoneId(legacyActiveFive)).toBe('lava-5min-slot');
    const legacyActiveTen = RunSnapshotV1Schema.parse({ ...base, elapsedSeconds: 600, activeBoss: { id: 'lava-behemoth', typeId: 'lava-behemoth', hp: 100, maxHp: 220 } });
    expect(getRestoredMilestoneId(legacyActiveTen)).toBe('castle-warlord-10min');
  });
});
