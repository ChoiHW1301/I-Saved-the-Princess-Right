import { describe, expect, it } from 'vitest';
import { scaledEnemyHp } from '../systems/EnemyProgression.js';
import { enemyCatalog } from '../content/enemies.js';
import { enemyForSpawnRoll } from '../systems/EnemyProgression.js';

describe('scaledEnemyHp', () => {
  it('keeps the opening wave unchanged through 2:30', () => {
    expect(scaledEnemyHp(6, 0, false)).toBe(6);
    expect(scaledEnemyHp(6, 150, false)).toBe(6);
  });
  it('ramps ordinary durability toward the mini-boss while rushers remain fragile', () => {
    expect(scaledEnemyHp(6, 180, false)).toBeGreaterThan(6);
    expect(scaledEnemyHp(6, 300, false)).toBe(14);
    expect(scaledEnemyHp(2, 300, true)).toBe(2);
  });
  it('reserves exactly the first five percent of spawn rolls for the reward monster', () => {
    expect(enemyForSpawnRoll(0.049999, enemyCatalog).id).toBe('fortune-wraith');
    expect(enemyForSpawnRoll(0.05, enemyCatalog).id).toBe('sky-wisp');
    expect(enemyForSpawnRoll(0.999999, enemyCatalog).id).toBe('keep-ghoul');
  });
});
