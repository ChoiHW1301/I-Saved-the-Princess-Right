import type { RunState } from '@caravan/contracts';
import type { Vector2 } from './CombatSystem.js';

export const ARCHER_DASH_DISTANCE = 160;
export const ARCHER_DASH_DURATION_MS = 250;
export const ARCHER_DASH_COOLDOWN_MS = 4_000;
export const MAGE_WIND_RADIUS = 200;
export const MAGE_WIND_COOLDOWN_MS = 8_000;

export function updateDash(run: RunState, delta: number): boolean {
  if (!Number.isFinite(delta) || delta <= 0) return run.dashRemainingMs > 0;
  run.activeAbilityCooldownMs = Math.max(0, run.activeAbilityCooldownMs - delta);
  run.dashRemainingMs = Math.max(0, run.dashRemainingMs - delta);
  return run.dashRemainingMs > 0;
}

export function startArcherDash(run: RunState, direction: Vector2): boolean {
  if (run.characterId !== 'archer' || (run.trainingLevels['archer-dash'] ?? 0) < 1
    || !canActivate(run) || !Number.isFinite(direction.x) || !Number.isFinite(direction.y)) return false;
  const length = Math.hypot(direction.x, direction.y);
  if (length === 0) return false;
  run.dashDirection = { x: direction.x / length, y: direction.y / length };
  run.dashRemainingMs = ARCHER_DASH_DURATION_MS;
  run.activeAbilityCooldownMs = ARCHER_DASH_COOLDOWN_MS;
  run.player.invulnerableMs = Math.max(run.player.invulnerableMs, ARCHER_DASH_DURATION_MS);
  return true;
}

export function startMageWindSpirit(run: RunState): boolean {
  if (run.characterId !== 'mage' || (run.trainingLevels['mage-wind-spirit'] ?? 0) < 1 || !canActivate(run)) return false;
  run.activeAbilityCooldownMs = MAGE_WIND_COOLDOWN_MS;
  return true;
}

export function resolveWindKnockback(
  origin: Vector2,
  target: Vector2,
  radius: number,
  isMidboss: boolean,
  isFinalBoss: boolean,
): Vector2 | null {
  if (isFinalBoss || !Number.isFinite(radius) || radius <= 0) return null;
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distance = Math.hypot(dx, dy);
  if (distance >= radius) return null;
  const displacement = (radius - distance) * (isMidboss ? 0.5 : 1);
  const direction = distance === 0 ? { x: 1, y: 0 } : { x: dx / distance, y: dy / distance };
  return { x: target.x + direction.x * displacement, y: target.y + direction.y * displacement };
}

function canActivate(run: RunState): boolean {
  // Boss encounters pause the campaign clock, but combat itself remains active.
  return run.status === 'active' && !run.player.isDead && (run.pausedBy === 'none' || run.pausedBy === 'boss') && run.activeAbilityCooldownMs <= 0;
}
