import { describe, expect, it } from 'vitest';
import { enemyCatalog } from '../content/enemies.js';

describe('enemy roles', () => {
  it('keeps ordinary monsters focused on the warrior', () => {
    expect(enemyCatalog[0]).toMatchObject({ id: 'keep-ghoul', maxHp: 10, targetPolicy: 'warrior-priority', wagonPriority: false });
  });

  it('adds a low-health flying imp that rushes the caravan', () => {
    const flyer = enemyCatalog.find((enemy) => enemy.flying);
    expect(flyer).toMatchObject({ id: 'imp', maxHp: 8, targetPolicy: 'caravan-priority', wagonPriority: true });
    expect(flyer?.maxHp).toBeLessThan(enemyCatalog[0]!.maxHp);
  });

});
