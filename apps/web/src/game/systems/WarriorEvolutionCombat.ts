export function getWhirlwindIntervalMs(attackSpeedBonus: number): number {
  return 500 / Math.max(0.1, 1 + (Number.isFinite(attackSpeedBonus) ? attackSpeedBonus : 0));
}

export function getWhirlwindDamageRatio(rank: number): number {
  return 0.5 + 0.1 * Math.min(5, Math.max(0, Math.floor(Number.isFinite(rank) ? rank : 0)));
}

export function getMultiSwordStrikeCount(rank: number): number {
  return 2 + Math.min(3, Math.max(0, Math.floor(Number.isFinite(rank) ? rank : 0)));
}

export function getSwordWaveHitProfile(hitIndex: number): { damageRatio: number; sizeRatio: number } {
  const ratio = Math.max(0.2, (5 - Math.min(4, Math.max(0, Math.floor(Number.isFinite(hitIndex) ? hitIndex : 0)))) / 5);
  return { damageRatio: ratio, sizeRatio: ratio };
}

export function getVanguardMaxHp(baseHp: number, currentMaxHp: number): number {
  return baseHp + 2 * Math.max(0, currentMaxHp - baseHp);
}

export function getVanguardHeatDamage(rank: number): number {
  return 2 + 2 * Math.min(5, Math.max(0, Math.floor(Number.isFinite(rank) ? rank : 0)));
}
