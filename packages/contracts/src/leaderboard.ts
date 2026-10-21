import { z } from 'zod';
import { CharacterIdSchema } from './profile.js';
import { CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

export const KarmaTierSchema = z.enum(['good', 'neutral', 'evil']);
export type KarmaTier = z.infer<typeof KarmaTierSchema>;
export const EndingIdSchema = z.enum(['princess-purified', 'princess-died', 'hero-new-demon-king', 'caravan-lost']);
export type EndingId = z.infer<typeof EndingIdSchema>;
export const BossIdSchema = z.enum(['castle-warlord', 'lava-behemoth', 'princess-demon', 'king-guard']);
export type BossId = z.infer<typeof BossIdSchema>;

export const RunReceiptDocumentSchema = withDocumentLimit(z.object({
  id: IdSchema,
  userId: UserIdSchema,
  runId: IdSchema,
  score: CounterSchema,
  goldAward: CounterSchema,
  status: z.enum(['won', 'lost']),
  endingId: EndingIdSchema,
  characterId: CharacterIdSchema,
  elapsedSeconds: CounterSchema,
  kills: CounterSchema,
  defeatedBossIds: z.array(BossIdSchema).max(3),
  karma: z.number().finite().int().min(-100).max(100),
  createdAt: IsoDateTimeSchema,
}).strict());
export type RunReceiptDocument = z.infer<typeof RunReceiptDocumentSchema>;

export const LeaderboardEntrySchema = withDocumentLimit(z.object({
  id: UserIdSchema,
  boardId: z.string().min(1).max(128).regex(/^(score|clear:[a-z-]+:(good|neutral|evil))$/),
  userId: UserIdSchema,
  displayName: z.string().min(1).max(128),
  score: CounterSchema,
  kills: CounterSchema,
  characterId: CharacterIdSchema,
  karmaTier: KarmaTierSchema,
  elapsedSeconds: CounterSchema,
  clear: z.boolean(),
  updatedAt: IsoDateTimeSchema,
}).strict());
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
