import type { CurrentRunSaveV1, RunSnapshotV1, RunState } from '@caravan/contracts';
import { getCharacterDefinition } from '../content/characters.js';
import { upgradeCatalog } from '../content/upgrades.js';
import { getBiomeAt } from './BiomeTransitionSystem.js';
import type { RewardPickupState } from './RewardPickupSystem.js';

export interface SnapshotEnemy { id: string; typeId: string; x: number; y: number; hp: number; attackCooldownMs: number; bossMilestoneId?: string; dead?: boolean }
export interface SnapshotInput {
  run: RunState; player: { x: number; y: number }; rngSeed: number; ordinarySpawnCooldownMs: number;
  enemies: readonly SnapshotEnemy[]; worldWidth: number; roadCenterY: number; activeBossMaxHp?: number; pendingEventId?: string | null;
  approachingEvent?: { eventId: string; x: number } | null;
  rewardPickups?: readonly RewardPickupState[];
}

export interface WorldPoint { x: number; y: number }

export function mapSnapshotWorldPoint(
  point: WorldPoint,
  snapshot: Pick<RunSnapshotV1, 'worldWidth' | 'roadCenterY'>,
  target: { width: number; height: number; roadCenterY: number },
): WorldPoint {
  return {
    x: Math.max(0, Math.min(target.width, point.x * target.width / snapshot.worldWidth)),
    y: Math.max(0, Math.min(target.height, point.y + target.roadCenterY - snapshot.roadCenterY)),
  };
}

export function createSnapshot(input: SnapshotInput): RunSnapshotV1 {
  const { run } = input;
  const boss = input.enemies.find((enemy) => enemy.bossMilestoneId);
  return {
    characterId: run.characterId,
    worldWidth: input.worldWidth,
    roadCenterY: input.roadCenterY,
    elapsedSeconds: Math.floor(run.elapsedSeconds),
    stageId: getBiomeAt(run.elapsedSeconds, run.defeatedBossIds).to,
    rngSeed: input.rngSeed >>> 0,
    karma: run.karma,
    status: run.status === 'active' ? 'active' : run.status,
    pendingEventId: input.pendingEventId ?? null,
    approachingEvent: input.approachingEvent ?? null,
    rewardPickups: (input.rewardPickups ?? []).map((pickup) => ({ ...pickup })),
    eventChoiceIds: [...run.eventChoiceIds],
    ordinarySpawnCooldownMs: Math.max(0, Math.floor(input.ordinarySpawnCooldownMs)),
    activeBoss: boss ? { id: boss.bossMilestoneId!, typeId: boss.typeId, hp: Math.ceil(boss.hp), maxHp: Math.ceil(input.activeBossMaxHp ?? boss.hp) } : null,
    player: { x: input.player.x, y: input.player.y, hp: Math.floor(run.player.hp), maxHp: Math.floor(run.player.maxHp), level: run.level, xp: run.xp, xpToNext: run.xpToNext, respawnMs: Math.ceil(run.player.respawnMs), invulnerableMs: Math.ceil(run.player.invulnerableMs) },
    wagon: { hp: Math.floor(run.caravan.hp), maxHp: Math.floor(run.caravan.maxHp) },
    runGold: run.runGold,
    kills: run.kills,
    pendingLevelUps: run.pendingLevelUps,
    pendingChoices: run.pendingChoices.map((choice) => ({ ...choice })),
    weaponLevels: { ...run.weaponLevels },
    upgradeStats: { ...run.upgradeStats },
    trainingLevels: { ...run.trainingLevels },
    activeAbilityCooldownMs: Math.ceil(run.activeAbilityCooldownMs),
    dashRemainingMs: Math.ceil(run.dashRemainingMs),
    dashDirection: { ...run.dashDirection },
    upgradeIds: [...run.selectedUpgradeIds],
    defeatedBossIds: [...run.defeatedBossIds],
    enemies: input.enemies.filter((enemy) => !enemy.dead).map(({ id, typeId, x, y, hp, attackCooldownMs }) => ({ id, typeId, x, y, hp: Math.ceil(hp), attackCooldownMs: Math.ceil(attackCooldownMs) })),
    projectiles: [],
  };
}

export function restoreSnapshot(save: CurrentRunSaveV1): RunState {
  const snapshot = save.snapshot;
  return {
    runId: save.runId, status: 'active', elapsedSeconds: snapshot.elapsedSeconds, characterId: snapshot.characterId,
    level: snapshot.player.level, xp: snapshot.player.xp, xpToNext: snapshot.player.xpToNext,
    karma: snapshot.karma, runGold: snapshot.runGold, kills: snapshot.kills,
    selectedUpgradeIds: [...snapshot.upgradeIds], weaponLevels: { ...snapshot.weaponLevels },
    equippedWeaponIds: [getCharacterDefinition(snapshot.characterId).startingWeaponId, ...snapshot.upgradeIds.flatMap((id) => {
      const stat = upgradeCatalog.find((upgrade) => upgrade.id === id)?.stat;
      return stat?.startsWith('add-weapon:') ? [stat.slice('add-weapon:'.length)] : [];
    })].filter((id, index, all) => all.indexOf(id) === index),
    eventChoiceIds: [...snapshot.eventChoiceIds], defeatedBossIds: snapshot.defeatedBossIds as RunState['defeatedBossIds'],
    pausedBy: snapshot.pendingChoices.length ? 'level-up' : snapshot.pendingEventId ? 'event' : 'none',
    player: { hp: snapshot.player.hp, maxHp: snapshot.player.maxHp, isDead: snapshot.player.hp <= 0, respawnMs: snapshot.player.respawnMs, invulnerableMs: snapshot.player.invulnerableMs },
    caravan: { hp: snapshot.wagon.hp, maxHp: snapshot.wagon.maxHp }, pendingChoices: snapshot.pendingChoices.map((choice) => ({ ...choice })),
    pendingLevelUps: snapshot.pendingLevelUps, upgradeStats: { ...snapshot.upgradeStats },
    trainingLevels: { ...snapshot.trainingLevels }, activeAbilityCooldownMs: snapshot.activeAbilityCooldownMs,
    dashRemainingMs: snapshot.dashRemainingMs, dashDirection: { ...snapshot.dashDirection },
  };
}
