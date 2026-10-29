import { z } from 'zod';
import { CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

export const MetaUpgradeIdSchema = z.enum([
  'max-health', 'attack-damage', 'critical-chance', 'move-speed', 'attack-speed',
  'health-regeneration', 'wagon-max-health', 'xp-gain', 'gold-gain', 'defense',
]);
export type MetaUpgradeId = z.infer<typeof MetaUpgradeIdSchema>;
export const TrainingIdSchema = z.enum(['warrior-thorn-armor', 'warrior-taunt', 'archer-dash', 'mage-wind-spirit', 'merchant-money-bomb']);
export type TrainingId = z.infer<typeof TrainingIdSchema>;
export const PassiveIdSchema = z.enum(['iron-will', 'keen-edge', 'swift-step']);
export type PassiveId = z.infer<typeof PassiveIdSchema>;

const CurrentCharacterIdSchema = z.enum(['warrior', 'archer', 'mage', 'merchant', 'dark-warrior']);
const LegacyCharacterIdSchema = z.enum(['hero', 'dark-hero']).transform((id) => id === 'hero' ? 'warrior' as const : 'dark-warrior' as const);
export const CharacterIdSchema = z.union([CurrentCharacterIdSchema, LegacyCharacterIdSchema]);
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
  characterTrainingLevels: z.partialRecord(CharacterIdSchema, z.partialRecord(TrainingIdSchema, CounterSchema)).default({}),
  passiveIds: z.array(PassiveIdSchema).max(100).refine((ids) => new Set(ids).size === ids.length),
  updatedAt: IsoDateTimeSchema,
}).strict());

export type PlayerProfile = z.infer<typeof PlayerProfileSchema>;
