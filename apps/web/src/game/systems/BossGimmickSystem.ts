import type { BossId } from '@caravan/contracts';
import type { Vector2 } from './CombatSystem.js';

export type LavaGiantPhase = 'approach' | 'tell' | 'charge' | 'stunned';
export interface LavaGiantState {
  kind: 'lava-giant'; phase: LavaGiantPhase; phaseRemainingMs: number; nextTellMs: number;
  chargeDirection: Vector2 | null; hitPlayerThisCharge: boolean; hitWagonThisCharge: boolean;
}
export interface LavaMagicianState { kind: 'lava-magician'; crossedHpThresholds: number; summonCooldownMs: number }
export type BossGimmickState = LavaGiantState | LavaMagicianState;

export const LAVA_GIANT_TELL_MS = 2_000;
export const LAVA_GIANT_TELL_INTERVAL_MS = 6_000;
export const LAVA_GIANT_CHARGE_SPEED = 1000;
export const LAVA_GIANT_WALL_STUN_MS = 4_000;
export const LAVA_GIANT_DAMAGE = 40;
export const LAVA_GIANT_PRE_STUN_DAMAGE_TAKEN_MULTIPLIER = 0.5;
export const LAVA_GIANT_STUN_DAMAGE_MULTIPLIER = 1.5;
export const LAVA_MAGICIAN_INITIAL_SUMMON_MS = 2_000;
export const LAVA_MAGICIAN_MIN_SUMMON_MS = 1_500;
export const LAVA_MAGICIAN_SUMMON_REDUCTION_MS = 50;
export const LAVA_MAGICIAN_SIGIL_NEAR_WAGON_CHANCE = 0.25;
export const LAVA_MAGICIAN_SIGIL_NEAR_WAGON_RADIUS = 120;
export const BOSS_COLLISION_RADIUS = 92;
export type LavaGiantFacing = { texture: 'lava-giant-up' | 'lava-giant-down' | 'lava-giant-side'; flipX: boolean };

export function getLavaGiantFacing(dx: number, dy: number): LavaGiantFacing {
  if (Math.abs(dx) > Math.abs(dy)) return { texture: 'lava-giant-side', flipX: dx < 0 };
  return { texture: dy < 0 ? 'lava-giant-up' : 'lava-giant-down', flipX: false };
}

export function createBossGimmickState(bossId: BossId): BossGimmickState | null {
  if (bossId === 'lava-giant') return {
    kind: 'lava-giant', phase: 'approach', phaseRemainingMs: 0, nextTellMs: LAVA_GIANT_TELL_INTERVAL_MS,
    chargeDirection: null, hitPlayerThisCharge: false, hitWagonThisCharge: false,
  };
  if (bossId === 'lava-magician') return { kind: 'lava-magician', crossedHpThresholds: 0, summonCooldownMs: LAVA_MAGICIAN_INITIAL_SUMMON_MS };
  return null;
}

export function advanceBossGimmick(state: BossGimmickState, deltaMs: number): BossGimmickState {
  const delta = Number.isFinite(deltaMs) ? Math.max(0, deltaMs) : 0;
  if (state.kind === 'lava-magician') return { ...state, summonCooldownMs: Math.max(0, state.summonCooldownMs - delta) };
  if (state.phase === 'stunned') {
    const remaining = Math.max(0, state.phaseRemainingMs - delta);
    return remaining === 0 ? { ...state, phase: 'approach', phaseRemainingMs: 0, chargeDirection: null } : { ...state, phaseRemainingMs: remaining };
  }
  const nextTellMs = Math.max(0, state.nextTellMs - delta);
  if (state.phase === 'tell') {
    const remaining = Math.max(0, state.phaseRemainingMs - delta);
    return remaining === 0
      ? { ...state, phase: 'charge', phaseRemainingMs: 0, nextTellMs, hitPlayerThisCharge: false, hitWagonThisCharge: false }
      : { ...state, phaseRemainingMs: remaining, nextTellMs };
  }
  if (state.phase === 'approach' && nextTellMs === 0) return { ...state, phase: 'tell', phaseRemainingMs: LAVA_GIANT_TELL_MS, nextTellMs: LAVA_GIANT_TELL_INTERVAL_MS };
  return { ...state, nextTellMs };
}

export function beginLavaGiantCharge(state: LavaGiantState, direction: Vector2): LavaGiantState {
  const length = Math.hypot(direction.x, direction.y);
  return {
    ...state, phase: 'charge', phaseRemainingMs: 0,
    chargeDirection: length > 0 ? { x: direction.x / length, y: direction.y / length } : { x: 1, y: 0 },
    hitPlayerThisCharge: false, hitWagonThisCharge: false,
  };
}

export function avoidNearestWallChargeDirection(start: Vector2, target: Vector2, width: number, height: number): Vector2 {
  const dx = target.x - start.x;
  const dy = target.y - start.y;
  const length = Math.hypot(dx, dy);
  const direction = length > 0 ? { x: dx / length, y: dy / length } : { x: 1, y: 0 };
  const inset = BOSS_COLLISION_RADIUS;
  const walls = [
    { side: 'left', distance: start.x - inset },
    { side: 'right', distance: width - inset - start.x },
    { side: 'top', distance: start.y - inset },
    { side: 'bottom', distance: height - inset - start.y },
  ] as const;
  const nearestDistance = Math.min(...walls.map((wall) => wall.distance));
  const nearestWalls = walls.filter((wall) => Math.abs(wall.distance - nearestDistance) < 1e-6);
  for (const wall of nearestWalls) {
    if (wall.side === 'left' && direction.x < 0) direction.x = 0;
    if (wall.side === 'right' && direction.x > 0) direction.x = 0;
    if (wall.side === 'top' && direction.y < 0) direction.y = 0;
    if (wall.side === 'bottom' && direction.y > 0) direction.y = 0;
  }
  const correctedLength = Math.hypot(direction.x, direction.y);
  if (correctedLength > 0) return { x: direction.x / correctedLength, y: direction.y / correctedLength };

  const awayFromNearestWalls = { x: 0, y: 0 };
  for (const wall of nearestWalls) {
    if (wall.side === 'left') awayFromNearestWalls.x += 1;
    if (wall.side === 'right') awayFromNearestWalls.x -= 1;
    if (wall.side === 'top') awayFromNearestWalls.y += 1;
    if (wall.side === 'bottom') awayFromNearestWalls.y -= 1;
  }
  const awayLength = Math.hypot(awayFromNearestWalls.x, awayFromNearestWalls.y);
  return awayLength > 0 ? { x: awayFromNearestWalls.x / awayLength, y: awayFromNearestWalls.y / awayLength } : { x: 1, y: 0 };
}

export function clampBossPositionToWorld(position: Vector2, width: number, height: number, radius: number): Vector2 {
  const inset = Math.max(0, radius);
  return {
    x: Math.max(inset, Math.min(width - inset, position.x)),
    y: Math.max(inset, Math.min(height - inset, position.y)),
  };
}

export function stunLavaGiant(state: LavaGiantState): LavaGiantState {
  return { ...state, phase: 'stunned', phaseRemainingMs: LAVA_GIANT_WALL_STUN_MS, chargeDirection: null };
}

export function getLavaMagicianThreshold(maxHp: number, hp: number): number {
  if (!Number.isFinite(maxHp) || maxHp <= 0 || !Number.isFinite(hp)) return 0;
  return Math.max(0, Math.min(10, Math.floor((maxHp - Math.max(0, hp)) / (maxHp * 0.1) + 1e-9)));
}

export function getLavaMagicianSummonInterval(maxHp: number, hp: number): number {
  const threshold = getLavaMagicianThreshold(maxHp, hp);
  return Math.max(LAVA_MAGICIAN_MIN_SUMMON_MS, LAVA_MAGICIAN_INITIAL_SUMMON_MS - threshold * LAVA_MAGICIAN_SUMMON_REDUCTION_MS);
}

export function shouldSummonPlayerTargetedLavaSigil(maxHp: number, hp: number): boolean {
  return Number.isFinite(maxHp) && maxHp > 0 && Number.isFinite(hp) && hp <= maxHp * 0.5;
}

export function applyLavaMagicianDamage(state: LavaMagicianState, maxHp: number, hp: number): { state: LavaMagicianState; teleported: boolean } {
  const threshold = getLavaMagicianThreshold(maxHp, hp);
  if (threshold <= state.crossedHpThresholds) return { state, teleported: false };
  return { state: { ...state, crossedHpThresholds: threshold }, teleported: hp > 0 };
}

export interface Rect { left: number; right: number; top: number; bottom: number }
export function segmentIntersectsRect(start: Vector2, end: Vector2, rect: Rect): boolean {
  let tMin = 0, tMax = 1;
  const dx = end.x - start.x, dy = end.y - start.y;
  for (const [origin, direction, min, max] of [[start.x, dx, rect.left, rect.right], [start.y, dy, rect.top, rect.bottom]] as const) {
    if (Math.abs(direction) < 1e-8) { if (origin < min || origin > max) return false; continue; }
    const a = (min - origin) / direction, b = (max - origin) / direction;
    tMin = Math.max(tMin, Math.min(a, b)); tMax = Math.min(tMax, Math.max(a, b));
    if (tMin > tMax) return false;
  }
  return tMax >= 0 && tMin <= 1;
}

export function segmentIntersectsCircle(start: Vector2, end: Vector2, center: Vector2, radius: number): boolean {
  const dx = end.x - start.x, dy = end.y - start.y;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((center.x - start.x) * dx + (center.y - start.y) * dy) / lengthSquared));
  return Math.hypot(start.x + t * dx - center.x, start.y + t * dy - center.y) <= radius;
}

export function chooseLavaMagicianTeleport(random: () => number, width: number, height: number, avoidPositions: readonly Vector2[] = []): Vector2 {
  const inset = BOSS_COLLISION_RADIUS + 2;
  const candidates = [
    { x: inset, y: height / 2 },
    { x: width - inset, y: height / 2 },
    { x: width / 2, y: inset },
    { x: width / 2, y: height - inset },
  ];
  const available = candidates.filter((candidate) => !avoidPositions.some((position) => Math.hypot(candidate.x - position.x, candidate.y - position.y) < 1));
  const choices = available.length > 0 ? available : candidates;
  const roll = random();
  const index = Number.isFinite(roll) ? Math.min(choices.length - 1, Math.max(0, Math.floor(roll * choices.length))) : 0;
  return choices[index]!;
}

export function chooseLavaSigilPosition(random: () => number, width: number, height: number, wagon: Vector2): Vector2 {
  if (random() < LAVA_MAGICIAN_SIGIL_NEAR_WAGON_CHANCE) {
    const angle = 2 * Math.PI * random();
    const distance = LAVA_MAGICIAN_SIGIL_NEAR_WAGON_RADIUS * Math.sqrt(random());
    return { x: wagon.x + Math.cos(angle) * distance, y: wagon.y + Math.sin(angle) * distance };
  }
  return { x: random() * width, y: random() * height };
}
