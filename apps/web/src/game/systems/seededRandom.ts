export type SeededRandom = (() => number) & { getState(): number };

export function seededRandom(seed: number): SeededRandom {
  let state = seed >>> 0;
  const random = (() => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }) as SeededRandom;
  random.getState = () => state;
  return random;
}
