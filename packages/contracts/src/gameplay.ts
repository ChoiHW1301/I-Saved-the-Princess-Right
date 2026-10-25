import { z } from 'zod';
import type { CharacterId, RunStatus } from './index.js';
import { CharacterIdSchema } from './profile.js';

export const UpgradeDefinitionSchema = z.object({
  id: z.string().min(1).max(64), name: z.string().min(1).max(100), description: z.string().min(1).max(240),
  maxLevel: z.number().int().min(1).max(20), appliesTo: z.enum(['warrior', 'weapon', 'caravan']),
  stat: z.string().min(1).max(64), values: z.array(z.number().finite()).min(1).max(20),
  weight: z.number().finite().positive().max(1000), characterIds: z.array(CharacterIdSchema).max(5).optional(),
}).strict().refine((upgrade) => upgrade.values.length === upgrade.maxLevel, {
  message: 'Each upgrade level must have exactly one configured value.',
});
export interface UpgradeDefinition {
  id: string; name: string; description: string; maxLevel: number; appliesTo: 'warrior' | 'weapon' | 'caravan';
  stat: string; values: number[]; weight: number; characterIds?: CharacterId[];
}

export const UpgradeChoiceSchema = z.object({
  id: z.string().min(1).max(64), nextLevel: z.number().int().min(1).max(20), value: z.number().finite(),
}).strict();
export interface UpgradeChoice { id: string; nextLevel: number; value: number }

export const PlayerRunStateSchema = z.object({
  hp: z.number().finite().nonnegative(), maxHp: z.number().finite().positive(), isDead: z.boolean(),
  respawnMs: z.number().finite().nonnegative(), invulnerableMs: z.number().finite().nonnegative(),
}).strict();
export const CaravanRunStateSchema = z.object({
  hp: z.number().finite().nonnegative(), maxHp: z.number().finite().positive(),
}).strict();
export interface PlayerRunState { hp: number; maxHp: number; isDead: boolean; respawnMs: number; invulnerableMs: number }
export interface CaravanRunState { hp: number; maxHp: number }

export const RunStateSchema = z.object({
  runId: z.string().min(1).max(128), status: z.enum(['active', 'won', 'lost']), elapsedSeconds: z.number().finite().nonnegative(),
  characterId: CharacterIdSchema, level: z.number().int().min(1), xp: z.number().int().nonnegative(), xpToNext: z.number().int().positive(),
  karma: z.number().int().min(-100).max(100), runGold: z.number().int().nonnegative(), kills: z.number().int().nonnegative(),
  selectedUpgradeIds: z.array(z.string().min(1).max(64)).max(500), weaponLevels: z.record(z.string().min(1).max(64), z.number().int().nonnegative()),
  equippedWeaponIds: z.array(z.string().min(1).max(64)).max(20),
  eventChoiceIds: z.array(z.string().min(1).max(128)).max(100),
  defeatedBossIds: z.array(z.enum(['castle-warlord', 'lava-behemoth', 'forest-warden', 'princess-demon', 'king-guard'])).max(4),
  pausedBy: z.enum(['none', 'level-up', 'event', 'boss', 'network']), player: PlayerRunStateSchema, caravan: CaravanRunStateSchema,
  pendingChoices: z.array(UpgradeChoiceSchema).max(3), pendingLevelUps: z.number().int().nonnegative(),
  upgradeStats: z.record(z.string().min(1).max(64), z.number().finite()),
}).strict();
export interface RunState {
  runId: string; status: RunStatus; elapsedSeconds: number; characterId: CharacterId;
  level: number; xp: number; xpToNext: number; karma: number; runGold: number; kills: number;
  selectedUpgradeIds: string[]; weaponLevels: Record<string, number>; equippedWeaponIds: string[]; eventChoiceIds: string[]; defeatedBossIds: import('./leaderboard.js').BossId[];
  pausedBy: 'none' | 'level-up' | 'event' | 'boss' | 'network';
  player: PlayerRunState;
  caravan: CaravanRunState; pendingChoices: UpgradeChoice[]; pendingLevelUps: number;
  upgradeStats: Record<string, number>;
}

export function getXpToNextLevel(level: number): number {
  if (!Number.isInteger(level) || level < 1) throw new RangeError('Level must be a positive integer.');
  return Math.floor(10 + 5 * (level - 1) + 2 * (level - 1) ** 2);
}
