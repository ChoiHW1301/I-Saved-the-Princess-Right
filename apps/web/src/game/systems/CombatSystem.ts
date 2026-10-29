import type { EnemyTarget } from '../content/enemies.js';

export interface Vector2 { x: number; y: number }
export interface Damageable { id: string; hp: number; maxHp: number; dead?: boolean }
export interface DamageResult { target: Damageable; damage: number; killed: boolean; sourceId: string }
export interface CriticalDamageResult { damage: number; critical: boolean }
export type TargetPolicy = 'warrior-priority' | 'nearest' | 'caravan-priority';

export function rollCriticalDamage(baseDamage: number, criticalChance: number, random: () => number): CriticalDamageResult {
  const chance = Number.isFinite(criticalChance) ? Math.max(0, Math.min(1, criticalChance)) : 0;
  const roll = random();
  const critical = Number.isFinite(roll) && roll < chance;
  return { damage: critical ? baseDamage * 2 : baseDamage, critical };
}

export function distanceSquared(a: Vector2, b: Vector2): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
}

export function chooseTarget(enemy: Vector2, warrior: Vector2, wagon: Vector2, policy: TargetPolicy): EnemyTarget {
  if (policy === 'caravan-priority') return 'caravan';
  if (policy === 'warrior-priority') return 'warrior';
  return distanceSquared(enemy, warrior) <= distanceSquared(enemy, wagon) ? 'warrior' : 'caravan';
}

export function resolveHit<T extends Damageable>(target: T, amount: number, sourceId: string): DamageResult | null {
  if (target.dead || !Number.isFinite(amount) || amount <= 0) return null;
  const before = Math.max(0, Math.min(target.hp, target.maxHp));
  target.hp = Math.max(0, Math.min(target.maxHp, before - amount));
  const killed = target.hp === 0;
  if (killed) target.dead = true;
  return { target, damage: before - target.hp, killed, sourceId };
}
