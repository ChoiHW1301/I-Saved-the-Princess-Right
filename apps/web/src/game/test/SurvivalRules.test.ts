import { describe, expect, it } from 'vitest';
import { createRunState } from '../state/RunState.js';
import { HealthSystem } from '../systems/HealthSystem.js';
import { RespawnSystem } from '../systems/RespawnSystem.js';

describe('survival rules', () => {
  it('ends the run only when caravan durability reaches zero', () => {
    const run = createRunState();
    const health = new HealthSystem();
    health.damageCaravan(run.caravan, 249, run);
    expect(run.status).toBe('active');
    health.damageCaravan(run.caravan, 100, run);
    expect(run.caravan.hp).toBe(0);
    expect(run.status).toBe('lost');
    expect(health.damageCaravan(run.caravan, 1, run)).toBe(false);
  });
  it('respawns a defeated hero after three seconds at full HP with two seconds of invulnerability', () => {
    const run = createRunState();
    const health = new HealthSystem();
    const respawn = new RespawnSystem();
    health.damagePlayer(run.player, 500);
    expect(run.player).toMatchObject({ hp: 0, isDead: true, respawnMs: 3000 });
    expect(respawn.update(run.player, 2999)).toBe(false);
    expect(respawn.update(run.player, 1)).toBe(true);
    expect(run.player).toMatchObject({ hp: 100, isDead: false, invulnerableMs: 2000 });
    expect(health.damagePlayer(run.player, 10)).toBe(false);
  });
  it('ignores damage while the player is dead or temporarily invulnerable', () => {
    const run = createRunState();
    const health = new HealthSystem();
    run.player.invulnerableMs = 500;
    expect(health.damagePlayer(run.player, 25)).toBe(false);
    expect(run.player.hp).toBe(100);
  });
});
