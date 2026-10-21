import type { KarmaTier, RunState } from '@caravan/contracts';

export function getKarmaTier(karma: number): KarmaTier {
  if (!Number.isInteger(karma) || karma < -100 || karma > 100) throw new RangeError('Karma must be an integer from -100 to 100.');
  if (karma <= -50) return 'evil';
  if (karma >= 50) return 'good';
  return 'neutral';
}

export function applyKarma(current: number, delta: number): number {
  if (!Number.isInteger(current) || current < -100 || current > 100 || !Number.isInteger(delta)) {
    throw new RangeError('Karma and its change must be integers; karma must be from -100 to 100.');
  }
  return Math.max(-100, Math.min(100, current + delta));
}

export function getRunKarmaTier(run: Pick<RunState, 'karma'>): KarmaTier { return getKarmaTier(run.karma); }
