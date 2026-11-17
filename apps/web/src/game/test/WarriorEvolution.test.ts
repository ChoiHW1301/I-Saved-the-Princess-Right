import { describe, expect, it } from 'vitest';
import { rollWarriorEvolutionChoices, warriorEvolutionCatalog } from '../content/warriorEvolution.js';

describe('warrior evolution', () => {
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
