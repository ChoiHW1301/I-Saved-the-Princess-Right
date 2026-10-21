import { describe, expect, it } from 'vitest';
import { resolveEnding } from '../systems/EndingSystem.js';

describe('karma ending resolution', () => {
  it('resolves good, neutral, and evil final boss outcomes', () => {
    expect(resolveEnding('won', 50, 'princess-demon').id).toBe('princess-purified');
    expect(resolveEnding('won', 0, 'princess-demon').id).toBe('princess-died');
    expect(resolveEnding('won', -50, 'king-guard').id).toBe('hero-new-demon-king');
  });
  it('uses the caravan loss ending and validates victory boss routes', () => {
    expect(resolveEnding('lost', 100).id).toBe('caravan-lost');
    expect(() => resolveEnding('won', -50, 'princess-demon')).toThrow();
    expect(() => resolveEnding('active', 0)).toThrow();
    expect(() => resolveEnding('won', 101, 'princess-demon')).toThrow(RangeError);
  });
});
