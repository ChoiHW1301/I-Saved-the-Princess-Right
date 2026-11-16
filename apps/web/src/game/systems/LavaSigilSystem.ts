import { distanceSquared, resolveHit, type DamageResult, type Damageable, type Vector2 } from './CombatSystem.js';

export const LAVA_SIGIL_MAX_HP = 1;
export const LAVA_SIGIL_FUSE_MS = 3000;
export const LAVA_SIGIL_EXPLOSION_RADIUS = 100;
export const LAVA_SIGIL_HIT_RADIUS = LAVA_SIGIL_EXPLOSION_RADIUS;
export const LAVA_SIGIL_DISPLAY_DIAMETER = LAVA_SIGIL_EXPLOSION_RADIUS * 2;
export const LAVA_SIGIL_EXPLOSION_DAMAGE = 25;

export interface LavaSigilFuseState {
  dead: boolean;
  remainingMs: number;
}

export interface LavaSigilRect { left: number; right: number; top: number; bottom: number }

export function isWithinLavaSigilRadius(center: Vector2, target: Vector2, radius = LAVA_SIGIL_EXPLOSION_RADIUS): boolean {
  return distanceSquared(center, target) <= radius * radius;
}

export function isWithinLavaSigilRectRadius(center: Vector2, rect: LavaSigilRect, radius = LAVA_SIGIL_EXPLOSION_RADIUS): boolean {
  const nearest = { x: Math.max(rect.left, Math.min(rect.right, center.x)), y: Math.max(rect.top, Math.min(rect.bottom, center.y)) };
  return distanceSquared(center, nearest) <= radius * radius;
}

export function shouldRenderLavaSigilBehindWagon(center: Vector2, wagonBounds: LavaSigilRect): boolean {
  return isWithinLavaSigilRectRadius(center, wagonBounds, LAVA_SIGIL_EXPLOSION_RADIUS);
}

export function applyLavaSigilHit(target: Damageable, sourceId: string): DamageResult | null {
  return resolveHit(target, 1, sourceId);
}

export function advanceLavaSigil(state: LavaSigilFuseState, deltaMs: number): 'active' | 'expired' | 'destroyed' {
  if (state.dead) return 'destroyed';
  if (!Number.isFinite(deltaMs) || deltaMs <= 0) return 'active';
  state.remainingMs = Math.max(0, state.remainingMs - deltaMs);
  return state.remainingMs === 0 ? 'expired' : 'active';
}
