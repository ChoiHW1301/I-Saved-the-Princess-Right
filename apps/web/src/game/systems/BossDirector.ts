import type { BossId, RunState } from '@caravan/contracts';
import { bossCatalog, type BossDefinition } from '../content/bosses.js';

export interface BossState { bossId: BossId; hp: number; phase: 'intro' | 'combat'; attackCooldownMs: number; alive: boolean }

export class BossDirector {
  private state: BossState | null = null;
  get activeBoss(): BossState | null { return this.state ? { ...this.state } : null; }
  startBoss(bossId: string, run: RunState): BossDefinition | null {
    const definition = bossCatalog[bossId as BossId];
    if (!definition || run.status !== 'active' || run.pausedBy === 'boss' || this.state?.alive) return null;
    this.state = { bossId: definition.id, hp: definition.maxHp, phase: 'intro', attackCooldownMs: 0, alive: true };
    run.pausedBy = 'boss';
    return definition;
  }
  syncBoss(hp: number, attackCooldownMs: number): void {
    if (!this.state?.alive || !Number.isFinite(hp) || !Number.isFinite(attackCooldownMs)) return;
    this.state.phase = 'combat';
    this.state.hp = Math.max(0, hp);
    this.state.attackCooldownMs = Math.max(0, attackCooldownMs);
  }
  defeatBoss(bossId: string, run: RunState): boolean {
    if (!this.state?.alive || this.state.bossId !== bossId || run.status !== 'active') return false;
    this.state.alive = false;
    if (!run.defeatedBossIds.includes(this.state.bossId)) run.defeatedBossIds.push(this.state.bossId);
    run.pausedBy = 'none';
    return true;
  }
}
