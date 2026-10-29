import type { Enemy } from '../entities/Enemy.js';
import { chooseTarget, distanceSquared, type Vector2 } from './CombatSystem.js';

export interface EnemyAttack { enemy: Enemy; target: 'warrior' | 'caravan'; damage: number }

export const WARRIOR_TAUNT_RADIUS = 300;

export class EnemyDirector {
  private targetRefreshMs = 0;
  update(enemies: readonly Enemy[], warrior: Vector2, caravan: Vector2, delta: number, warriorAvailable = true, tauntUnlocked = false): EnemyAttack[] {
    this.targetRefreshMs -= delta;
    const refreshTargets = this.targetRefreshMs <= 0;
    if (refreshTargets) this.targetRefreshMs = 250;
    const attacks: EnemyAttack[] = [];
    for (const enemy of enemies) {
      if (enemy.dead) continue;
      enemy.attackCooldownMs = Math.max(0, enemy.attackCooldownMs - delta);
      if (refreshTargets) enemy.target = !warriorAvailable
        ? 'caravan'
        : tauntUnlocked && enemy.definition.wagonPriority && distanceSquared(enemy.worldPosition, warrior) <= WARRIOR_TAUNT_RADIUS ** 2
          ? 'warrior'
          : chooseTarget(enemy.worldPosition, warrior, caravan, enemy.definition.targetPolicy);
      const destination = enemy.target === 'warrior' ? warrior : caravan;
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
        const previousX = enemy.x;
        enemy.setPosition(enemy.x + (destination.x - enemy.x) / distance * travel,
          enemy.y + (destination.y - enemy.y) / distance * travel);
        enemy.setFacingDirection(enemy.x - previousX);
      }
    }
    return attacks;
  }
}
