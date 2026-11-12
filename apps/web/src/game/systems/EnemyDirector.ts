import type { Enemy } from '../entities/Enemy.js';
import { chooseTarget, distanceSquared, type Vector2 } from './CombatSystem.js';

export interface EnemyAttack { enemy: Enemy; target: 'warrior' | 'caravan'; damage: number }

export const WARRIOR_TAUNT_RADIUS = 200;
export const WAGON_COLLISION_HALF_WIDTH = 112;
export const WAGON_COLLISION_HALF_HEIGHT = 36;

interface Rect { left: number; right: number; top: number; bottom: number }

function enemyRadius(enemy: Enemy): number {
  return enemy.bossMilestoneId ? 46 : enemy.definition.flying ? 20 : enemy.definition.wagonPriority ? 28 : 32;
}

function expandedWagon(caravan: Vector2, radius: number): Rect {
  return {
    left: caravan.x - WAGON_COLLISION_HALF_WIDTH - radius,
    right: caravan.x + WAGON_COLLISION_HALF_WIDTH + radius,
    top: caravan.y - WAGON_COLLISION_HALF_HEIGHT - radius,
    bottom: caravan.y + WAGON_COLLISION_HALF_HEIGHT + radius,
  };
}

function pointInside(point: Vector2, rect: Rect): boolean {
  return point.x > rect.left && point.x < rect.right && point.y > rect.top && point.y < rect.bottom;
}

function pushOutside(enemy: Enemy, rect: Rect): void {
  if (!pointInside(enemy.worldPosition, rect)) return;
  const edges = [
    { distance: enemy.x - rect.left, x: rect.left - 1, y: enemy.y },
    { distance: rect.right - enemy.x, x: rect.right + 1, y: enemy.y },
    { distance: enemy.y - rect.top, x: enemy.x, y: rect.top - 1 },
    { distance: rect.bottom - enemy.y, x: enemy.x, y: rect.bottom + 1 },
  ].sort((a, b) => a.distance - b.distance);
  enemy.setPosition(edges[0]!.x, edges[0]!.y);
}

function segmentIntersectsRect(start: Vector2, end: Vector2, rect: Rect): boolean {
  let tMin = 0;
  let tMax = 1;
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  for (const [origin, direction, min, max] of [[start.x, dx, rect.left, rect.right], [start.y, dy, rect.top, rect.bottom]] as const) {
    if (Math.abs(direction) < 1e-8) { if (origin < min || origin > max) return false; continue; }
    const a = (min - origin) / direction;
    const b = (max - origin) / direction;
    tMin = Math.max(tMin, Math.min(a, b));
    tMax = Math.min(tMax, Math.max(a, b));
    if (tMin > tMax) return false;
  }
  return tMax >= 0 && tMin <= 1;
}

function nearestPointOnWagon(point: Vector2, caravan: Vector2): Vector2 {
  return {
    x: Math.max(caravan.x - WAGON_COLLISION_HALF_WIDTH, Math.min(caravan.x + WAGON_COLLISION_HALF_WIDTH, point.x)),
    y: Math.max(caravan.y - WAGON_COLLISION_HALF_HEIGHT, Math.min(caravan.y + WAGON_COLLISION_HALF_HEIGHT, point.y)),
  };
}

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
      const radius = enemyRadius(enemy);
      const expanded = expandedWagon(caravan, radius + 5);
      pushOutside(enemy, expanded);
      const destination = enemy.target === 'warrior' ? warrior : nearestPointOnWagon(enemy.worldPosition, caravan);
      const blockedByWagon = enemy.target === 'warrior' && segmentIntersectsRect(enemy.worldPosition, warrior, expanded);
      const targetDistance = distanceSquared(enemy.worldPosition, destination);
      const attackDistance = enemy.target === 'caravan' ? enemy.definition.attackRange + radius : enemy.definition.attackRange;
      if (targetDistance <= attackDistance ** 2 && !blockedByWagon) {
        if (enemy.attackCooldownMs === 0) {
          attacks.push({ enemy, target: enemy.target, damage: enemy.definition.damage });
          enemy.attackCooldownMs = 1000;
        }
        continue;
      }
      const distance = Math.sqrt(targetDistance);
      if (distance > 0) {
        const previousX = enemy.x;
        let waypoint = destination;
        if (blockedByWagon) {
          const corners = [
            { x: expanded.left - 2, y: expanded.top - 2 }, { x: expanded.right + 2, y: expanded.top - 2 },
            { x: expanded.left - 2, y: expanded.bottom + 2 }, { x: expanded.right + 2, y: expanded.bottom + 2 },
          ].filter((corner) => !segmentIntersectsRect(enemy.worldPosition, corner, expanded));
          if (!corners.length) corners.push({ x: expanded.left - 2, y: expanded.top - 2 });
          waypoint = corners.sort((a, b) => Math.hypot(a.x - enemy.x, a.y - enemy.y) + Math.hypot(warrior.x - a.x, warrior.y - a.y)
            - (Math.hypot(b.x - enemy.x, b.y - enemy.y) + Math.hypot(warrior.x - b.x, warrior.y - b.y)))[0]!;
        }
        const waypointDistance = Math.hypot(waypoint.x - enemy.x, waypoint.y - enemy.y);
        const travel = Math.min(Math.max(0, waypointDistance - (enemy.target === 'warrior' ? 0 : attackDistance)), enemy.definition.speed * delta / 1000);
        if (waypointDistance > 0 && travel > 0) enemy.setPosition(enemy.x + (waypoint.x - enemy.x) / waypointDistance * travel,
          enemy.y + (waypoint.y - enemy.y) / waypointDistance * travel);
        enemy.setFacingDirection(enemy.x - previousX);
      }
    }
    return attacks;
  }
}
