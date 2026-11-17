import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WarriorEvolutionOverlay } from '../ui/WarriorEvolutionOverlay.js';

describe('warrior evolution overlay', () => {
  it('renders exactly the two offered trees with their upgrade names', () => {
    const html = renderToStaticMarkup(createElement(WarriorEvolutionOverlay,
      { choices: ['whirlwind', 'vanguard'], onChoose: () => undefined }));
    expect(html).toContain('role="dialog"');
    expect(html.match(/<button/g)).toHaveLength(2);
    expect(html).toContain('훨윈드');
    expect(html).toContain('승리를 위한 회전');
    expect(html).toContain('선봉장');
    expect(html).toContain('뜨거운 열기');
    expect(html).not.toContain('검기 강화');
  });
});
