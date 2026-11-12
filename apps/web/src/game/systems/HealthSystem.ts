import type { CaravanState, PlayerState, RunState } from '../state/RunState.js';

export class HealthSystem {
  damagePlayer(player: PlayerState, amount: number, damageReduction = 0): boolean {
    if (player.isDead || player.invulnerableMs > 0 || !Number.isFinite(amount) || amount <= 0) return false;
    const reduction = Number.isFinite(damageReduction) ? Math.max(0, Math.min(1, damageReduction)) : 0;
    player.hp = Math.max(0, player.hp - amount * (1 - reduction));
    if (player.hp === 0) {
      player.isDead = true;
      if (player.respawnsRemaining > 0) {
        player.respawnsRemaining -= 1;
        player.respawnMs = 5000;
      } else player.respawnMs = 0;
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
