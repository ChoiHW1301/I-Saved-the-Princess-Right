export type RunStatus = 'active' | 'lost';
export interface PlayerState {
  hp: number;
  maxHp: number;
  isDead: boolean;
  respawnMs: number;
  invulnerableMs: number;
}
export interface CaravanState { hp: number; maxHp: number }
export interface RunState {
  runId: string;
  status: RunStatus;
  elapsedSeconds: number;
  player: PlayerState;
  caravan: CaravanState;
  kills: number;
}

let nextRunId = 1;
export function createRunState(): RunState {
  return {
    runId: `local-run-${nextRunId++}`, status: 'active', elapsedSeconds: 0,
    player: { hp: 100, maxHp: 100, isDead: false, respawnMs: 0, invulnerableMs: 0 },
    caravan: { hp: 250, maxHp: 250 }, kills: 0,
  };
}
