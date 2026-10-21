import { describe, expect, it } from 'vitest';
import { createRunState } from '../state/createRunState.js';
import { EventSystem } from '../systems/EventSystem.js';

describe('story event choices', () => {
  it('pauses the run and applies only the chosen contextual result', () => {
    const run = createRunState();
    const events = new EventSystem();
    expect(events.present('wounded-messenger', run)?.title).toBeTruthy();
    expect(run.pausedBy).toBe('event');
    const outcome = events.choose('wounded-messenger', 'yes', run);
    expect(outcome).toMatchObject({ choiceId: 'yes', karma: 12, wagonHp: 238, runGold: 0 });
    expect(run.eventChoiceIds).toEqual(['wounded-messenger:yes']);
    expect(run.pausedBy).toBe('none');
    expect(events.choose('wounded-messenger', 'yes', run)).toBeNull();
  });
  it('rejects invalid event IDs, choices, and overlapping events without changing state', () => {
    const run = createRunState();
    const events = new EventSystem();
    expect(events.present('not-in-catalog', run)).toBeNull();
    events.present('wounded-messenger', run);
    expect(events.present('captured-scout', run)).toBeNull();
    expect(events.choose('captured-scout', 'yes', run)).toBeNull();
    expect(run.karma).toBe(0);
  });
  it('clamps karma, caravan durability, and run-only gold', () => {
    const run = createRunState();
    const events = new EventSystem();
    run.karma = 98;
    run.caravan.hp = 248;
    run.runGold = 1;
    events.present('village-refugees', run);
    const outcome = events.choose('village-refugees', 'yes', run);
    expect(outcome).toMatchObject({ karma: 100, wagonHp: 230, runGold: 0 });
  });
});
