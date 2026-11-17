import { describe, expect, it } from 'vitest';
import { isWarriorEvolutionChoice, rollWarriorEvolutionChoices, shouldOfferWarriorEvolution, warriorEvolutionCatalog } from '../content/warriorEvolution.js';

describe('warrior evolution', () => {
  it('gates the reward to an unselected warrior at the lava milestone and rejects non-offered picks', () => {
    expect(shouldOfferWarriorEvolution('warrior', 'lava-5min-slot', null)).toBe(true);
    expect(shouldOfferWarriorEvolution('archer', 'lava-5min-slot', null)).toBe(false);
    expect(shouldOfferWarriorEvolution('warrior', 'castle-warlord-10min', null)).toBe(false);
    expect(shouldOfferWarriorEvolution('warrior', 'lava-5min-slot', 'whirlwind')).toBe(false);
    const choices = ['whirlwind', 'vanguard'] as const;
    expect(isWarriorEvolutionChoice(choices, 'whirlwind')).toBe(true);
    expect(isWarriorEvolutionChoice(choices, 'multi-sword')).toBe(false);
    expect(isWarriorEvolutionChoice(null, 'whirlwind')).toBe(false);
  });
  it('offers each unordered pair once across six equally sized roll bands', () => {
    const pairs = Array.from({ length: 6 }, (_, index) => rollWarriorEvolutionChoices(() => (index + 0.5) / 6));
    expect(new Set(pairs.map((pair) => pair.join(':'))).size).toBe(6);
    for (const pair of pairs) {
      expect(pair[0]).not.toBe(pair[1]);
      expect(pair.every((id) => warriorEvolutionCatalog.some((tree) => tree.id === id))).toBe(true);
    }
  });
  it('clamps edge and nonfinite random values', () => {
    expect(rollWarriorEvolutionChoices(() => Number.NaN)).toEqual(['whirlwind', 'multi-sword']);
    expect(rollWarriorEvolutionChoices(() => -1)).toEqual(['whirlwind', 'multi-sword']);
    expect(rollWarriorEvolutionChoices(() => 1)).toEqual(['sword-wave', 'vanguard']);
  });
});
