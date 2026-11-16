import { describe, expect, it } from 'vitest';
import { resolveHit } from '../systems/CombatSystem.js';
import {
  advanceBossGimmick, applyLavaMagicianDamage, beginLavaGiantCharge, BOSS_COLLISION_RADIUS, chooseLavaMagicianTeleport, chooseLavaSigilPosition,
  avoidNearestWallChargeDirection, clampBossPositionToWorld, createBossGimmickState, getLavaMagicianSummonInterval, getLavaMagicianThreshold,
  LAVA_GIANT_CHARGE_SPEED, LAVA_GIANT_PRE_STUN_DAMAGE_TAKEN_MULTIPLIER, LAVA_GIANT_STUN_DAMAGE_MULTIPLIER,
  LAVA_MAGICIAN_INITIAL_SUMMON_MS, LAVA_MAGICIAN_MIN_SUMMON_MS, LAVA_MAGICIAN_SUMMON_REDUCTION_MS, segmentIntersectsCircle, segmentIntersectsRect,
  shouldSummonPlayerTargetedLavaSigil,
  stunLavaGiant, type LavaGiantState, type LavaMagicianState,
} from '../systems/BossGimmickSystem.js';

describe('boss gimmick state', () => {
  it('starts giant tells after six seconds and locks aim when the two-second tell ends', () => {
    expect(LAVA_GIANT_CHARGE_SPEED).toBe(1000);
    expect(LAVA_GIANT_PRE_STUN_DAMAGE_TAKEN_MULTIPLIER).toBe(0.5);
    expect(LAVA_GIANT_STUN_DAMAGE_MULTIPLIER).toBe(1.5);
    expect(BOSS_COLLISION_RADIUS).toBe(92);
    const initial = createBossGimmickState('lava-giant') as LavaGiantState;
    const waiting = advanceBossGimmick(initial, 5_999);
    expect(waiting).toMatchObject({ phase: 'approach', nextTellMs: 1 });
    const tell = advanceBossGimmick(waiting, 1);
    expect(tell).toMatchObject({ phase: 'tell', phaseRemainingMs: 2_000 });
    const charging = beginLavaGiantCharge(advanceBossGimmick(tell, 2_000) as Extract<typeof tell, { kind: 'lava-giant' }>, { x: 3, y: 4 });
    expect(charging).toMatchObject({ phase: 'charge', chargeDirection: { x: 0.6, y: 0.8 }, hitPlayerThisCharge: false, hitWagonThisCharge: false });
  });

  it('keeps player aim away from walls and removes only the nearest-wall component', () => {
    const openField = avoidNearestWallChargeDirection({ x: 400, y: 400 }, { x: 700, y: 500 }, 1280, 960);
    expect(openField.x).toBeCloseTo(3 / Math.sqrt(10));
    expect(openField.y).toBeCloseTo(1 / Math.sqrt(10));

    const leftWall = avoidNearestWallChargeDirection({ x: 100, y: 480 }, { x: 0, y: 600 }, 1280, 960);
    expect(leftWall).toEqual({ x: 0, y: 1 });
    const directIntoWall = avoidNearestWallChargeDirection({ x: 100, y: 480 }, { x: 0, y: 480 }, 1280, 960);
    expect(directIntoWall).toEqual({ x: 1, y: 0 });
    const corner = avoidNearestWallChargeDirection({ x: 100, y: 100 }, { x: 0, y: 0 }, 1280, 960);
    expect(corner.x).toBeGreaterThan(0);
    expect(corner.y).toBeGreaterThan(0);
    expect(clampBossPositionToWorld({ x: -20, y: 1000 }, 1280, 960, BOSS_COLLISION_RADIUS)).toEqual({ x: 92, y: 868 });
  });

  it('takes half damage before the wall and increased damage during the stun window', () => {
    const giant = { id: 'lava-giant', hp: 100, maxHp: 100, damageTakenMultiplier: LAVA_GIANT_PRE_STUN_DAMAGE_TAKEN_MULTIPLIER };
    expect(resolveHit(giant, 40, 'test')?.damage).toBe(20);
    giant.damageTakenMultiplier = LAVA_GIANT_STUN_DAMAGE_MULTIPLIER;
    expect(resolveHit(giant, 40, 'test')?.damage).toBe(60);
  });

  it('maintains six seconds between tell starts and delays tells during a four-second stun', () => {
    const initial = createBossGimmickState('lava-giant') as LavaGiantState;
    let state = advanceBossGimmick(initial, 6_000) as LavaGiantState;
    state = advanceBossGimmick(state, 2_000) as LavaGiantState;
    expect(state).toMatchObject({ phase: 'charge', nextTellMs: 4_000 });
    state = stunLavaGiant(state);
    state = advanceBossGimmick(state, 4_000) as LavaGiantState;
    expect(state).toMatchObject({ phase: 'approach', nextTellMs: 4_000 });
    state = advanceBossGimmick(state, 4_000) as LavaGiantState;
    expect(state.phase).toBe('tell');
  });

  it('teleports once after a hit crosses one or more ten-percent thresholds', () => {
    expect(getLavaMagicianThreshold(220, 176)).toBe(2);
    const initial = createBossGimmickState('lava-magician') as LavaMagicianState;
    const crossing = applyLavaMagicianDamage(initial, 220, 130);
    expect(crossing).toMatchObject({ teleported: true, state: { crossedHpThresholds: 4, summonCooldownMs: 2_000 } });
    expect(applyLavaMagicianDamage(crossing.state, 220, 120).teleported).toBe(false);
    expect(LAVA_MAGICIAN_INITIAL_SUMMON_MS).toBe(2_000);
    expect(LAVA_MAGICIAN_SUMMON_REDUCTION_MS).toBe(50);
    expect(LAVA_MAGICIAN_MIN_SUMMON_MS).toBe(1_500);
    expect(getLavaMagicianSummonInterval(220, 220)).toBe(2_000);
    expect(getLavaMagicianSummonInterval(220, 198)).toBe(1_950);
    expect(getLavaMagicianSummonInterval(220, 110)).toBe(1_750);
    expect(getLavaMagicianSummonInterval(220, 130)).toBe(1_800);
    expect(getLavaMagicianSummonInterval(220, 0)).toBe(1_500);
  });

  it('chooses a different edge position when teleporting and targets the player at half health', () => {
    const current = { x: 94, y: 480 };
    expect(chooseLavaMagicianTeleport(() => 0, 1280, 960, [current])).toEqual({ x: 1186, y: 480 });
    expect(chooseLavaMagicianTeleport(() => 0.5, 1280, 960, [current, { x: 1186, y: 480 }])).toEqual({ x: 640, y: 866 });
    expect(shouldSummonPlayerTargetedLavaSigil(200, 100)).toBe(true);
    expect(shouldSummonPlayerTargetedLavaSigil(200, 101)).toBe(false);
    expect(shouldSummonPlayerTargetedLavaSigil(0, 0)).toBe(false);
  });

  it('places mage sigils in the wagon radius one quarter of the time and otherwise across the map', () => {
    const values = [0.1, 0.25, 0.25];
    let index = 0;
    const near = chooseLavaSigilPosition(() => values[index++]!, 1280, 960, { x: 640, y: 480 });
    expect(Math.hypot(near.x - 640, near.y - 480)).toBeCloseTo(60);
    const far = chooseLavaSigilPosition(() => 0.9, 1280, 960, { x: 640, y: 480 });
    expect(far).toEqual({ x: 1152, y: 864 });
  });

  it('keeps mage teleports outside the wagon collision rectangle and checks swept charge collisions', () => {
    const edgePositions = [0, 0.25, 0.5, 0.75].map((value) => chooseLavaMagicianTeleport(() => value, 1280, 960));
    expect(edgePositions).toEqual([
      { x: 94, y: 480 },
      { x: 1186, y: 480 },
      { x: 640, y: 94 },
      { x: 640, y: 866 },
    ]);
    const point = edgePositions[2]!;
    const wagon = { left: 436, right: 844, top: 352, bottom: 608 };
    expect(point.x > wagon.left && point.x < wagon.right && point.y > wagon.top && point.y < wagon.bottom).toBe(false);
    expect(segmentIntersectsRect({ x: 300, y: 480 }, { x: 900, y: 480 }, wagon)).toBe(true);
    expect(segmentIntersectsCircle({ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 200, y: 125 }, 26)).toBe(true);
    expect(segmentIntersectsCircle({ x: 100, y: 100 }, { x: 300, y: 100 }, { x: 200, y: 130 }, 26)).toBe(false);
  });
});
