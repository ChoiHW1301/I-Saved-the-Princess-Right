import { z } from 'zod';
import { CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

export const MetaUpgradeIdSchema = z.enum(['max-health', 'attack-damage', 'move-speed', 'wagon-max-health']);
export type MetaUpgradeId = z.infer<typeof MetaUpgradeIdSchema>;
export const PassiveIdSchema = z.enum(['iron-will', 'keen-edge', 'swift-step']);
export type PassiveId = z.infer<typeof PassiveIdSchema>;

export const CharacterIdSchema = z.enum(['hero', 'archer', 'mage', 'merchant', 'dark-hero']);
export type CharacterId = z.infer<typeof CharacterIdSchema>;

export const PlayerProfileSchema = withDocumentLimit(z.object({
  id: z.literal('profile'),
  userId: UserIdSchema,
  tenantId: IdSchema,
  objectId: IdSchema,
  version: CounterSchema,
  displayName: z.string().min(1).max(128),
  goldBalance: CounterSchema,
  lifetimeGoldEarned: CounterSchema.default(0),
  unlockedCharacters: z.array(CharacterIdSchema).max(32),
  permanentUpgradeLevels: z.record(z.string().min(1).max(64), CounterSchema),
  passiveIds: z.array(PassiveIdSchema).max(100).refine((ids) => new Set(ids).size === ids.length),
  updatedAt: IsoDateTimeSchema,
}).strict());

export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
