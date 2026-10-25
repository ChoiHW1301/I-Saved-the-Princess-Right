export type RewardType = 'gold' | 'experience' | 'player-health' | 'caravan-repair';
export interface RewardPickupState { id: string; type: RewardType; x: number; y: number; amount: number; remainingMs: number }

export function chooseRewardType(random: number): RewardType {
  const roll = Math.max(0, Math.min(0.999999, random));
  return (['gold', 'experience', 'player-health', 'caravan-repair'] as const)[Math.floor(roll * 4)]!;
}

export function pickupVisible(remainingMs: number, elapsedMs: number): boolean {
  if (remainingMs > 5000) return true;
  const progress = Math.max(0, Math.min(1, (5000 - remainingMs) / 5000));
  const interval = 300 - progress * 225;
  return Math.floor(elapsedMs / interval) % 2 === 0;
}

export function updatePickup(state: RewardPickupState, deltaMs: number): boolean {
  state.remainingMs = Math.max(0, state.remainingMs - Math.max(0, deltaMs));
  return state.remainingMs > 0;
}
