
export interface ScoreConfig {
  killWeight: number;
  secondWeight: number;
  bossWeight: number;
  clearBonus: number;
}

export interface GoldConfig {
  goldPerKill: number;
  survivalGoldPerMinute: number;
  clearBonus: number;
}

export const scoreConfig: Readonly<ScoreConfig> = Object.freeze({
  killWeight: 100,
  secondWeight: 1,
  bossWeight: 500,
  clearBonus: 2000,
});

export const goldConfig: Readonly<GoldConfig> = Object.freeze({
  goldPerKill: 1,
  survivalGoldPerMinute: 5,
  clearBonus: 50,
});

export const merchantUnlockGold = 1000;
