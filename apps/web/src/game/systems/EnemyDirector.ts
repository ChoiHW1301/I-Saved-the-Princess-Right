import type { Enemy } from '../entities/Enemy.js';
import { chooseTarget, distanceSquared, type Vector2 } from './CombatSystem.js';

export interface EnemyAttack { enemy: Enemy; target: 'hero' | 'caravan'; damage: number }

export class EnemyDirector {
  private targetRefreshMs = 0;
  update(enemies: readonly Enemy[], hero: Vector2, caravan: Vector2, delta: number, heroAvailable = true): EnemyAttack[] {
    this.targetRefreshMs -= delta;
    const refreshTargets = this.targetRefreshMs <= 0;
    if (refreshTargets) this.targetRefreshMs = 250;
    const attacks: EnemyAttack[] = [];
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      enemy.attackCooldownMs = Math.max(0, enemy.attackCooldownMs - delta);
      if (refreshTargets) enemy.target = !heroAvailable && enemy.definition.targetPolicy === 'nearest'
        ? 'caravan'
        : chooseTarget(enemy.worldPosition, hero, caravan, enemy.definition.targetPolicy);
      const destination = enemy.target === 'hero' ? hero : caravan;
      const rangeSquared = enemy.definition.attackRange ** 2;
      const distSq = distanceSquared(enemy.worldPosition, destination);
      if (distSq <= rangeSquared) {
        if (enemy.attackCooldownMs === 0) {
          attacks.push({ enemy, target: enemy.target, damage: enemy.definition.damage });
          enemy.attackCooldownMs = 1000;
        }
        continue;
      }
      const distance = Math.sqrt(distSq);
      if (distance > 0) {
        const travel = Math.min(distance - enemy.definition.attackRange, enemy.definition.speed * delta / 1000);
        enemy.setPosition(enemy.x + (destination.x - enemy.x) / distance * travel,
          enemy.y + (destination.y - enemy.y) / distance * travel);
      }
    }
    return attacks;
  }
}
