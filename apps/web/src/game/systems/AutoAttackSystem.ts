import type { Enemy } from '../entities/Enemy.js';
import { distanceSquared, resolveHit, type Vector2 } from './CombatSystem.js';

export interface WeaponConfig { damage: number; range: number; cooldownMs: number }
export interface AutoAttackHit { enemy: Enemy; damage: number; killed: boolean }

export function selectNearestEnemy(origin: Vector2, enemies: readonly Enemy[], range: number): Enemy | null {
  let selected: Enemy | null = null;
  let bestDistance = range * range;
  for (const enemy of enemies) {
    if (enemy.dead) continue;
    const distance = distanceSquared(origin, enemy.worldPosition);
    if (distance <= bestDistance) { selected = enemy; bestDistance = distance; }
  }
  return selected;
}

export class AutoAttackSystem {
  private cooldownMs = 0;
  constructor(private readonly weapon: WeaponConfig = { damage: 10, range: 125, cooldownMs: 600 }) {}
  applyUpgrade(stat: string, amount: number): void {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (stat === 'sword-damage') this.weapon.damage += amount;
    if (stat === 'sword-range') this.weapon.range += amount;
  }
  update(warrior: Vector2, enemies: readonly Enemy[], delta: number): AutoAttackHit | null {
    this.cooldownMs = Math.max(0, this.cooldownMs - delta);
    if (this.cooldownMs > 0) return null;
    const target = selectNearestEnemy(warrior, enemies, this.weapon.range);
    if (!target) return null;
    const hit = resolveHit(target, this.weapon.damage, 'warrior-sword');
    if (!hit) return null;
    this.cooldownMs = this.weapon.cooldownMs;
    return { enemy: target, damage: hit.damage, killed: hit.killed };
  }
}
