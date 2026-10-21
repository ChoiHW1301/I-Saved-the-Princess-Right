import { CAMPAIGN_DURATION_SECONDS, campaignSchedule, type CampaignMilestone, validateCampaignSchedule } from '../content/campaignSchedule.js';

export class CampaignClock {
  elapsedSeconds = 0;
  pausedReason: string | null = null;
  private readonly emittedIds = new Set<string>();
  constructor(private readonly schedule: readonly CampaignMilestone[] = campaignSchedule) {
    validateCampaignSchedule(schedule);
  }

  update(deltaMs: number): CampaignMilestone[] {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0 || this.pausedReason !== null) return [];
    const proposedTime = Math.min(CAMPAIGN_DURATION_SECONDS, this.elapsedSeconds + deltaMs / 1000);
    const next = this.schedule.find((milestone) => !this.emittedIds.has(milestone.id) && milestone.atSeconds <= proposedTime);
    if (next) {
      this.elapsedSeconds = next.atSeconds;
      this.emittedIds.add(next.id);
      return [next];
    }
    this.elapsedSeconds = proposedTime;
    return [];
  }

  pause(reason: string): void {
    if (reason.trim()) this.pausedReason = reason;
  }

  resume(reason?: string): boolean {
    if (this.pausedReason === null || (reason !== undefined && this.pausedReason !== reason)) return false;
    this.pausedReason = null;
    return true;
  }

  get durationSeconds(): number { return CAMPAIGN_DURATION_SECONDS; }
  hasEmitted(id: string): boolean { return this.emittedIds.has(id); }
}
