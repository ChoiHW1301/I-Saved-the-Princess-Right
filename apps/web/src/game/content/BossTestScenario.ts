import type { BossId } from '@caravan/contracts';
import type { CampaignMilestoneKind } from './campaignSchedule.js';
import type { StageId } from './biomes.js';

export interface BossTestScenario {
  bossId: BossId;
  atSeconds: number;
  milestoneId: string;
  kind: Extract<CampaignMilestoneKind, 'miniboss' | 'final-boss'>;
}

export interface BossPostClearTestScenario {
  bossId: BossId;
  atSeconds: number;
  milestoneId: string;
  nextBiomeId: StageId;
  nextBiomeTitle: string;
}

export const bossTestScenarios: readonly BossTestScenario[] = [
  { bossId: 'lava-giant', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
  { bossId: 'lava-magician', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
  { bossId: 'castle-warlord', atSeconds: 600, milestoneId: 'castle-warlord-10min', kind: 'miniboss' },
  { bossId: 'forest-warden', atSeconds: 900, milestoneId: 'forest-warden', kind: 'miniboss' },
  { bossId: 'princess-demon', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
  { bossId: 'king-guard', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
];

export const bossPostClearTestScenarios: readonly BossPostClearTestScenario[] = [
  { bossId: 'lava-giant', atSeconds: 300, milestoneId: 'lava-5min-slot', nextBiomeId: 'demon-castle', nextBiomeTitle: '어두운 폐허' },
  { bossId: 'lava-magician', atSeconds: 300, milestoneId: 'lava-5min-slot', nextBiomeId: 'demon-castle', nextBiomeTitle: '어두운 폐허' },
  { bossId: 'castle-warlord', atSeconds: 600, milestoneId: 'castle-warlord-10min', nextBiomeId: 'enchanted-forest', nextBiomeTitle: '숲' },
  { bossId: 'forest-warden', atSeconds: 900, milestoneId: 'forest-warden', nextBiomeId: 'meadow-village', nextBiomeTitle: '초원·마을' },
];

export function getBossTestScenario(bossId: BossId): BossTestScenario | undefined {
  return bossTestScenarios.find((scenario) => scenario.bossId === bossId);
}

export function getBossPostClearTestScenario(bossId: BossId): BossPostClearTestScenario | undefined {
  return bossPostClearTestScenarios.find((scenario) => scenario.bossId === bossId);
}

export function shouldOfferPostClearEvolution(bossId: BossId, characterId: string): boolean {
  return characterId === 'warrior' && getBossPostClearTestScenario(bossId)?.milestoneId === 'lava-5min-slot';
}
