import type { EnemyDefinition } from '../content/enemies.js';

export function scaledEnemyHp(baseHp: number, elapsedSeconds: number, playerLevel: number): number {
  const levelBonus = Math.max(0, (Number.isFinite(playerLevel) ? playerLevel : 1) - 1) * 0.15;
  const timeBonus = Math.max(0, Number.isFinite(elapsedSeconds) ? elapsedSeconds : 0) / 60 * 0.15;
  return Math.ceil(baseHp * (1 + levelBonus + timeBonus));
}

export function enemyForSpawnRoll(roll: number, catalog: readonly EnemyDefinition[]): EnemyDefinition {
  const reward = catalog.find((enemy) => enemy.rewardMonster);
  const ordinary = catalog.filter((enemy) => !enemy.rewardMonster);
  if (!reward || ordinary.length < 2) throw new Error('Enemy spawn catalog must include one reward and two ordinary types.');
  if (roll < 0.05) return reward;
  const normalRoll = Math.max(0, Math.min(0.999999, (roll - 0.05) / 0.95));
  return normalRoll < 0.1 ? ordinary[1]! : ordinary[0]!;
}
