import type { RunState } from '@caravan/contracts';
import { eventCatalog, type EventChoice, type StoryEvent } from '../content/events.js';
import { applyKarma } from './KarmaSystem.js';

export interface EventOutcome {
  eventId: string;
  choiceId: 'yes' | 'no';
  karma: number;
  wagonHp: number;
  runGold: number;
}

export class EventSystem {
  private activeEventId: string | null = null;
  constructor(private readonly catalog: readonly StoryEvent[] = eventCatalog) {}

  present(eventId: string, run: RunState): StoryEvent | null {
    const event = this.catalog.find((candidate) => candidate.id === eventId);
    if (!event || run.status !== 'active' || run.pausedBy !== 'none' || run.eventChoiceIds.some((id) => id.startsWith(`${eventId}:`))) return null;
    if (event.yes.id !== 'yes' || event.yes.label !== 'Yes' || event.no.id !== 'no' || event.no.label !== 'No'
      || !this.isChoiceValid(event.yes) || !this.isChoiceValid(event.no)) return null;
    this.activeEventId = eventId;
    run.pausedBy = 'event';
    return event;
  }

  choose(eventId: string, choiceId: 'yes' | 'no', run: RunState): EventOutcome | null {
    if (this.activeEventId !== eventId || run.pausedBy !== 'event' || run.status !== 'active'
      || run.eventChoiceIds.includes(`${eventId}:${choiceId}`)) return null;
    const event = this.catalog.find((candidate) => candidate.id === eventId);
    if (!event || event.yes.id !== 'yes' || event.yes.label !== 'Yes' || event.no.id !== 'no' || event.no.label !== 'No'
      || !this.isChoiceValid(event.yes) || !this.isChoiceValid(event.no)) return null;
    const choice = choiceId === 'yes' ? event.yes : choiceId === 'no' ? event.no : null;
    if (!choice) return null;
    run.karma = applyKarma(run.karma, choice.karmaDelta);
    run.caravan.hp = Math.max(0, Math.min(run.caravan.maxHp, run.caravan.hp + choice.wagonHpDelta));
    run.runGold = Math.max(0, run.runGold + choice.goldDelta);
    run.eventChoiceIds.push(`${eventId}:${choice.id}`);
    run.pausedBy = 'none';
    this.activeEventId = null;
    return { eventId, choiceId: choice.id, karma: run.karma, wagonHp: run.caravan.hp, runGold: run.runGold };
  }

  private isChoiceValid(choice: EventChoice): boolean {
    return (choice.id === 'yes' || choice.id === 'no') && (choice.label === 'Yes' || choice.label === 'No')
      && Number.isInteger(choice.karmaDelta) && Number.isInteger(choice.wagonHpDelta) && Number.isInteger(choice.goldDelta);
  }
}
