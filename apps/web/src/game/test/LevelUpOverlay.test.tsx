import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { choiceForNumberKey, LevelUpOverlay } from '../ui/LevelUpOverlay.js';

const choices = [
  { id: 'sword-damage', nextLevel: 1, value: 4 },
  { id: 'sword-range', nextLevel: 2, value: 22 },
];

describe('level-up overlay', () => {
  it('renders one card per available valid choice', () => {
    const html = renderToStaticMarkup(createElement(LevelUpOverlay, { level: 2, choices, onChoose: () => undefined }));
    expect(html).toContain('레벨 2');
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain('날카로운 검');
    expect(html).toContain('크게 휘둘러라');
  });
  it('maps number keys to visible choices and ignores unavailable keys', () => {
    expect(choiceForNumberKey('1', choices)?.id).toBe('sword-damage');
    expect(choiceForNumberKey('2', choices)?.id).toBe('sword-range');
    expect(choiceForNumberKey('3', choices)).toBeUndefined();
    expect(choiceForNumberKey('x', choices)).toBeUndefined();
  });
});
