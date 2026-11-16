import type { BossId } from '@caravan/contracts';
import type { CampaignMilestoneKind } from './campaignSchedule.js';

export interface BossTestScenario {
  bossId: BossId;
  atSeconds: number;
  milestoneId: string;
  kind: Extract<CampaignMilestoneKind, 'miniboss' | 'final-boss'>;
}

export const bossTestScenarios: readonly BossTestScenario[] = [
  { bossId: 'lava-giant', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
  { bossId: 'lava-magician', atSeconds: 300, milestoneId: 'lava-5min-slot', kind: 'miniboss' },
  { bossId: 'castle-warlord', atSeconds: 600, milestoneId: 'castle-warlord-10min', kind: 'miniboss' },
  { bossId: 'forest-warden', atSeconds: 900, milestoneId: 'forest-warden', kind: 'miniboss' },
  { bossId: 'princess-demon', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
  { bossId: 'king-guard', atSeconds: 1200, milestoneId: 'princess-demon', kind: 'final-boss' },
];

export function getBossTestScenario(bossId: BossId): BossTestScenario | undefined {
  return bossTestScenarios.find((scenario) => scenario.bossId === bossId);
}
