import { z } from 'zod';
import { CharacterIdSchema } from './profile.js';

export const CharacterDefinitionSchema = z.object({
  id: CharacterIdSchema,
  name: z.string().min(1).max(80),
  unlockRule: z.enum(['default', 'first-run', 'first-clear', 'shop-purchase']),
  startingWeaponId: z.string().min(1).max(64),
  baseStats: z.object({ maxHp: z.number().finite().positive(), speed: z.number().finite().positive(), damageMultiplier: z.number().finite().positive() }).strict(),
  beginner: z.boolean(),
}).strict();
export type CharacterDefinition = z.infer<typeof CharacterDefinitionSchema>;

export const WeaponDefinitionSchema = z.object({
  id: z.string().min(1).max(64), owner: CharacterIdSchema,
  kind: z.enum(['melee', 'projectile', 'spell', 'spread']), intervalMs: z.number().int().positive(),
  damage: z.number().finite().positive(), range: z.number().finite().positive(), projectileCount: z.number().int().positive(),
  penetration: z.number().int().nonnegative(), statusEffect: z.enum(['burn']).optional(), projectileSpread: z.number().nonnegative().max(Math.PI * 2).optional(),
}).strict();
export type WeaponDefinition = z.infer<typeof WeaponDefinitionSchema>;

export const MERCHANT_RECRUIT_COST = 10_000;
