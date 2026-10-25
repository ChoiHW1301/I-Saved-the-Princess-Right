import type { EnemyDefinition } from '../content/enemies.js';

export function scaledEnemyHp(baseHp: number, elapsedSeconds: number, wagonPriority: boolean): number {
  if (wagonPriority || elapsedSeconds <= 150) return baseHp;
  const factor = 1 + Math.min(2.25, Math.max(0, elapsedSeconds - 150) / 120);
  return Math.ceil(baseHp * factor);
}

export function enemyForSpawnRoll(roll: number, catalog: readonly EnemyDefinition[]): EnemyDefinition {
  const reward = catalog.find((enemy) => enemy.rewardMonster);
  const ordinary = catalog.filter((enemy) => !enemy.rewardMonster);
  if (!reward || ordinary.length < 3) throw new Error('Enemy spawn catalog must include one reward and three ordinary types.');
  if (roll < 0.05) return reward;
  const normalRoll = Math.max(0, Math.min(0.999999, (roll - 0.05) / 0.95));
  return normalRoll < 0.1 ? ordinary[2]! : normalRoll < 0.28 ? ordinary[1]! : ordinary[0]!;
}
