import type { CaravanState, PlayerState, RunState } from '../state/RunState.js';

export class HealthSystem {
  damagePlayer(player: PlayerState, amount: number): boolean {
    if (player.isDead || player.invulnerableMs > 0 || !Number.isFinite(amount) || amount <= 0) return false;
    player.hp = Math.max(0, player.hp - amount);
    if (player.hp === 0) {
      player.isDead = true;
      player.respawnMs = 3000;
    }
    return true;
  }
  damageCaravan(caravan: CaravanState, amount: number, run: RunState): boolean {
    if (run.status !== 'active' || !Number.isFinite(amount) || amount <= 0) return false;
    caravan.hp = Math.max(0, caravan.hp - amount);
    if (caravan.hp === 0) run.status = 'lost';
    return true;
  }
}
