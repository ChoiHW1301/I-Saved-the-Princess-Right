import type { CharacterId, RunState, WeaponDefinition } from '@caravan/contracts';
import { getCharacterDefinition } from '../content/characters.js';
import { weaponCatalog } from '../content/weapons.js';
import type { Enemy } from '../entities/Enemy.js';
import { distanceSquared, resolveHit, type Vector2 } from './CombatSystem.js';

export interface ProjectileSpawn { weaponId: string; targets: Enemy[]; targetPositions: Vector2[]; damage: number; penetration: number; statusEffect?: 'burn' }
interface BurnState { remainingMs: number; cooldownMs: number; damage: number }

export class WeaponSystem {
  private readonly cooldowns = new Map<string, number>();
  private readonly burns = new WeakMap<Enemy, BurnState>();

  addWeapon(run: RunState, weaponId: string): boolean {
    const weapon = weaponCatalog[weaponId];
    if (!weapon || weapon.owner !== run.characterId || run.equippedWeaponIds.includes(weaponId)) return false;
    run.equippedWeaponIds.push(weaponId);
    run.weaponLevels[weaponId] = 1;
    return true;
  }

  update(run: RunState, origin: Vector2, enemies: readonly Enemy[], delta: number, random: () => number = Math.random,
    onFire?: (projectile: ProjectileSpawn) => void, aimPoint: Vector2 = { x: origin.x + 1, y: origin.y }): Enemy[] {
    const killed = new Set<Enemy>();
    this.updateBurns(enemies, delta, killed);
    if (run.status !== 'active' || run.player.isDead || run.pausedBy === 'event' || run.pausedBy === 'level-up' || run.pausedBy === 'network') return [...killed];
    const character = getCharacterDefinition(run.characterId);
    for (const weaponId of run.equippedWeaponIds) {
      const weapon = weaponCatalog[weaponId];
      if (!weapon || weapon.owner !== run.characterId) continue;
      const attackSpeedBonus = weaponId === 'sword' ? run.upgradeStats['attack-speed'] ?? 0 : 0;
      const intervalMs = weapon.intervalMs / (1 + attackSpeedBonus);
      const cooldown = Math.max(0, (this.cooldowns.get(weaponId) ?? 0) - delta);
      if (cooldown > 0) { this.cooldowns.set(weaponId, cooldown); continue; }
      const rangeBonus = weaponId === 'sword' ? 0 : run.upgradeStats[`${weaponId}-range`] ?? run.upgradeStats['projectile-range'] ?? 0;
      const range = weapon.range + rangeBonus + (weaponId === 'sword' ? run.upgradeStats['sword-range'] ?? 0 : 0);
      const aimX = aimPoint.x - origin.x;
      const aimY = aimPoint.y - origin.y;
      const aimLength = Math.hypot(aimX, aimY);
      const directionAngle = aimLength > 1 ? Math.atan2(aimY, aimX) : 0;
      const attackDistance = aimLength > 1 ? Math.min(range, aimLength) : range;
      const extraCount = weaponId === 'gold-shotgun' ? run.upgradeStats['gold-shotgun-count'] ?? 0 : 0;
      const baseCount = weapon.projectileCount + extraCount;
      const penetration = weapon.penetration + (weaponId === 'bow' ? run.upgradeStats['bow-penetration'] ?? 0 : 0);
      const targetCount = weapon.kind === 'projectile' || weaponId === 'ice-spear' ? baseCount + penetration : baseCount;
      const spreadAngles = weapon.kind === 'spread'
        ? Array.from({ length: baseCount }, (_unused, index) => directionAngle + (baseCount === 1 ? 0 : -weapon.projectileSpread! / 2 + weapon.projectileSpread! * index / (baseCount - 1)))
        : [directionAngle];
      const targetPositions = spreadAngles.map((angle) => ({
        x: origin.x + Math.cos(angle) * attackDistance,
        y: origin.y + Math.sin(angle) * attackDistance,
      }));
      const available = weaponId === 'sword'
        ? enemies.filter((enemy) => {
          if (enemy.dead) return false;
          const x = enemy.worldPosition.x - origin.x;
          const y = enemy.worldPosition.y - origin.y;
          return x * x + y * y <= range * range && x * Math.cos(directionAngle) + y * Math.sin(directionAngle) >= 0;
        })
        : weapon.kind === 'spread'
          ? spreadAngles.flatMap((angle) => findTargetsOnAim(origin, angle, attackDistance, enemies).slice(0, 1))
          : findTargetsOnAim(origin, directionAngle, attackDistance, enemies).slice(0, targetCount);
      const weakCopyChance = weaponId === 'fireball' ? run.upgradeStats['fireball-weak-copy'] ?? 0 : 0;
      const directTargets = available;
      const damageMultiplier = character.baseStats.damageMultiplier * (1 + (run.upgradeStats['global-damage-multiplier'] ?? 0));
      const spreadTightness = weaponId === 'gold-shotgun' ? run.upgradeStats['gold-shotgun-tightness'] ?? 0 : 0;
      const damage = (weapon.damage + (run.upgradeStats[`${weaponId}-damage`] ?? 0)) * damageMultiplier * (1 + spreadTightness);
      const bowBurn = weaponId === 'bow' ? run.upgradeStats['bow-burn'] ?? 0 : 0;
      const statusEffect = weapon.statusEffect || bowBurn > 0 ? 'burn' : undefined;
      const hitTargets = [...directTargets];
      const impactArea = weaponId === 'fireball' ? run.upgradeStats['fireball-impact-area'] ?? 0 : 0;
      const impactRadius = impactArea + (run.upgradeStats['fireball-size'] ?? 0);
      if (impactRadius > 0 && targetPositions[0]) {
        for (const enemy of enemies) {
          if (distanceSquared(targetPositions[0], enemy.worldPosition) <= impactRadius * impactRadius && !hitTargets.includes(enemy)) hitTargets.push(enemy);
        }
      }
      onFire?.({ weaponId, targets: directTargets, targetPositions, damage, penetration, ...(statusEffect ? { statusEffect } : {}) });
      for (const enemy of hitTargets) {
        const copyDamage = weaponId === 'fireball' && random() < weakCopyChance ? damage * 0.45 : 0;
        const hit = resolveHit(enemy, damage + copyDamage, weaponId);
        if (hit?.killed) killed.add(enemy);
        if (statusEffect && !enemy.dead) this.applyBurn(enemy, bowBurn || Math.max(1, damage * 0.12));
      }
      this.cooldowns.set(weaponId, intervalMs);
    }
    return [...killed];
  }

  private applyBurn(enemy: Enemy, damage: number): void {
    const current = this.burns.get(enemy);
    this.burns.set(enemy, { remainingMs: Math.max(current?.remainingMs ?? 0, 2500), cooldownMs: current?.cooldownMs ?? 500, damage: Math.max(current?.damage ?? 0, damage) });
  }

  private updateBurns(enemies: readonly Enemy[], delta: number, killed: Set<Enemy>): void {
    for (const enemy of enemies) {
      const burn = this.burns.get(enemy);
      if (!burn || enemy.dead) continue;
      burn.remainingMs -= delta;
      burn.cooldownMs -= delta;
      while (burn.cooldownMs <= 0 && burn.remainingMs > 0 && !enemy.dead) {
        const hit = resolveHit(enemy, burn.damage, 'burn');
        if (hit?.killed) killed.add(enemy);
        burn.cooldownMs += 500;
      }
      if (burn.remainingMs <= 0) this.burns.delete(enemy);
    }
  }
}

function findTargetsOnAim(origin: Vector2, angle: number, distance: number, enemies: readonly Enemy[]): Enemy[] {
  const direction = { x: Math.cos(angle), y: Math.sin(angle) };
  return enemies.flatMap((enemy) => {
    if (enemy.dead) return [];
    const offsetX = enemy.worldPosition.x - origin.x;
    const offsetY = enemy.worldPosition.y - origin.y;
    const along = offsetX * direction.x + offsetY * direction.y;
    if (along < 0 || along > distance) return [];
    const nearestX = origin.x + direction.x * along;
    const nearestY = origin.y + direction.y * along;
    const radius = enemy.bossMilestoneId ? 48 : enemy.definition?.flying ? 18 : 26;
    return distanceSquared({ x: nearestX, y: nearestY }, enemy.worldPosition) <= radius * radius ? [{ enemy, along }] : [];
  }).sort((a, b) => a.along - b.along).map(({ enemy }) => enemy);
}

export function fireWeapons(state: RunState, targets: Enemy[]): ProjectileSpawn[] {
  return state.equippedWeaponIds.flatMap((weaponId) => {
    const weapon: WeaponDefinition | undefined = weaponCatalog[weaponId];
    if (!weapon || weapon.owner !== state.characterId || targets.length === 0) return [];
    const count = weapon.projectileCount + (weaponId === 'gold-shotgun' ? state.upgradeStats['gold-shotgun-count'] ?? 0 : 0);
    const selectedTargets = weapon.kind === 'spread'
      ? Array.from({ length: count }, (_unused, index) => targets[Math.min(index, targets.length - 1)]!)
      : targets.slice(0, count + weapon.penetration);
    return [{ weaponId, targets: selectedTargets, targetPositions: selectedTargets.map((enemy) => enemy.worldPosition), damage: weapon.damage, penetration: weapon.penetration,
      ...(weapon.statusEffect ? { statusEffect: weapon.statusEffect } : {}) }];
  });
}
