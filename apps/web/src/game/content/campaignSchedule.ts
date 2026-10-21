export type CampaignMilestoneKind = 'event' | 'miniboss' | 'final-boss';
export interface CampaignMilestone { atSeconds: number; kind: CampaignMilestoneKind; id: string }

export const CAMPAIGN_DURATION_SECONDS = 900;
export const BIOME_TRANSITION_SECONDS = 30;

export const campaignSchedule: readonly CampaignMilestone[] = [
  { atSeconds: 180, kind: 'event', id: 'wounded-messenger' },
  { atSeconds: 300, kind: 'miniboss', id: 'castle-warlord' },
  { atSeconds: 360, kind: 'event', id: 'abandoned-supply-cart' },
  { atSeconds: 540, kind: 'event', id: 'captured-scout' },
  { atSeconds: 600, kind: 'miniboss', id: 'lava-behemoth' },
  { atSeconds: 720, kind: 'event', id: 'village-refugees' },
  { atSeconds: 900, kind: 'final-boss', id: 'princess-demon' },
];

export function validateCampaignSchedule(schedule: readonly CampaignMilestone[]): void {
  const ids = new Set<string>();
  let previousTime = 0;
  for (const milestone of schedule) {
    if (!milestone.id.trim() || ids.has(milestone.id) || !Number.isFinite(milestone.atSeconds)
      || milestone.atSeconds <= previousTime || milestone.atSeconds > CAMPAIGN_DURATION_SECONDS
      || !['event', 'miniboss', 'final-boss'].includes(milestone.kind)) {
      throw new Error(`Invalid campaign milestone: ${milestone.id}`);
    }
    ids.add(milestone.id);
    previousTime = milestone.atSeconds;
  }
}

validateCampaignSchedule(campaignSchedule);
