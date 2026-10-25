import { describe, expect, it } from 'vitest';
import { chooseRewardType, pickupVisible, updatePickup, type RewardPickupState } from '../systems/RewardPickupSystem.js';

describe('reward pickup rules', () => {
  it('chooses each reward in an equal quarter of the random range', () => {
    expect([0, 0.25, 0.5, 0.75].map(chooseRewardType)).toEqual(['gold', 'experience', 'player-health', 'caravan-repair']);
  });
  it('expires after thirty seconds and blinks faster toward expiry', () => {
    const pickup: RewardPickupState = { id: 'p1', type: 'gold', x: 0, y: 0, amount: 10, remainingMs: 30_000 };
    expect(pickupVisible(5001, 0)).toBe(true);
    expect(pickupVisible(1, 100)).toBe(false);
    expect(updatePickup(pickup, 29_999)).toBe(true);
    expect(updatePickup(pickup, 1)).toBe(false);
  });
});
