import { describe, expect, it } from 'vitest';
import { enemyCatalog } from '../content/enemies.js';

describe('enemy roles', () => {
  it('keeps ordinary monsters focused on the warrior', () => {
    expect(enemyCatalog[0]).toMatchObject({ id: 'keep-ghoul', targetPolicy: 'warrior-priority', wagonPriority: false });
  });

  it('adds a low-health flying monster that rushes the caravan', () => {
    const flyer = enemyCatalog.find((enemy) => enemy.flying);
    expect(flyer).toMatchObject({ id: 'sky-wisp', maxHp: 4, targetPolicy: 'caravan-priority', wagonPriority: true });
    expect(flyer?.maxHp).toBeLessThan(enemyCatalog[0]!.maxHp);
  });
});
