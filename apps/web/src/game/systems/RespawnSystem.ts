import type { PlayerState } from '../state/RunState.js';

export class RespawnSystem {
  update(player: PlayerState, delta: number): boolean {
    if (player.isDead) {
      if (player.respawnMs <= 0) return false;
      player.respawnMs = Math.max(0, player.respawnMs - delta);
      if (player.respawnMs === 0) {
        player.isDead = false;
        player.hp = Math.ceil(player.maxHp / 2);
        player.invulnerableMs = 2000;
        return true;
      }
      return false;
    }
    player.invulnerableMs = Math.max(0, player.invulnerableMs - delta);
    return false;
  }
}
