import type { BossId, CharacterId, RunEndingSummary, RunSnapshotV1, UpgradeChoice } from '@caravan/contracts';
import type { StoryEvent } from '../content/events.js';
import type { CampaignMilestone } from '../content/campaignSchedule.js';

interface GameEvents {
  'level-up': { level: number; choices: UpgradeChoice[] };
  'upgrade-choice': { upgradeId: string };
  'level-up-complete': null;
  'story-event': StoryEvent;
  'event-choice': { eventId: string; choiceId: 'yes' | 'no' };
  'event-complete': { eventId: string };
  'boss-encounter': CampaignMilestone & { bossId: BossId };
  'boss-defeated': { milestoneId: string };
  'run-ended': RunEndingSummary;
  'continue-after-ending': RunEndingSummary;
  'snapshot-request': { reason: 'autosave' | 'checkpoint' | 'manual' };
  'snapshot-ready': { runId: string; characterId: CharacterId; snapshot: RunSnapshotV1; reason: 'autosave' | 'checkpoint' | 'manual'; resumeAfterSave: boolean };
  'snapshot-saved': { reason: 'autosave' | 'checkpoint' | 'manual'; resume: boolean };
  'snapshot-failed': { message: string };
  'resume-run': null;
  'pause-request': null;
}
type Listener<T> = (payload: T) => void;

class TypedEventBus {
  private readonly listeners = new Map<keyof GameEvents, Set<Listener<never>>>();
  on<K extends keyof GameEvents>(event: K, listener: Listener<GameEvents[K]>): () => void {
    let eventListeners = this.listeners.get(event);
    if (!eventListeners) { eventListeners = new Set(); this.listeners.set(event, eventListeners); }
    eventListeners.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }
  off<K extends keyof GameEvents>(event: K, listener: Listener<GameEvents[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<never>);
  }
  emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]): void {
    for (const listener of this.listeners.get(event) ?? []) (listener as Listener<GameEvents[K]>)(payload);
  }
  clear(): void { this.listeners.clear(); }
}

export const gameEventBus = new TypedEventBus();
export type { GameEvents };
