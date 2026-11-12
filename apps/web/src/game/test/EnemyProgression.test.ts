import { describe, expect, it } from 'vitest';
import { scaledEnemyHp } from '../systems/EnemyProgression.js';
import { enemyCatalog } from '../content/enemies.js';
import { enemyForSpawnRoll } from '../systems/EnemyProgression.js';

describe('scaledEnemyHp', () => {
  it('applies fractional time scaling from the first second', () => {
    expect(scaledEnemyHp(10, 0, 1)).toBe(10);
    expect(scaledEnemyHp(10, 1, 1)).toBe(11);
    expect(scaledEnemyHp(10, 150, 1)).toBe(14);
  });
  it('adds player-level growth and scales wagon-priority enemies too', () => {
    expect(scaledEnemyHp(10, 300, 1)).toBe(18);
    expect(scaledEnemyHp(10, 300, 4)).toBe(22);
    expect(scaledEnemyHp(8, 300, 4)).toBe(18);
  });
  it('reserves exactly the first five percent of spawn rolls for the reward monster', () => {
    expect(enemyForSpawnRoll(0.049999, enemyCatalog).id).toBe('golden-imp');
    expect(enemyCatalog.find((enemy) => enemy.rewardMonster)).toMatchObject({ id: 'golden-imp', maxHp: 20 });
    expect(enemyForSpawnRoll(0.05, enemyCatalog).id).toBe('imp');
    expect(enemyForSpawnRoll(0.999999, enemyCatalog).id).toBe('keep-ghoul');
  });
});
