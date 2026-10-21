import { z } from 'zod';
import { CharacterIdSchema } from './profile.js';
import { CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

export const KarmaTierSchema = z.enum(['good', 'neutral', 'evil']);
export type KarmaTier = z.infer<typeof KarmaTierSchema>;
export const EndingIdSchema = z.enum(['purified-princess', 'fallen-princess', 'kingdom-hunted']);
export type EndingId = z.infer<typeof EndingIdSchema>;

export const RunReceiptDocumentSchema = withDocumentLimit(z.object({
  id: IdSchema,
  userId: UserIdSchema,
  runId: IdSchema,
  score: CounterSchema,
  goldAward: CounterSchema,
  status: z.enum(['won', 'lost']),
  endingId: EndingIdSchema,
  createdAt: IsoDateTimeSchema,
}).strict());
export type RunReceiptDocument = z.infer<typeof RunReceiptDocumentSchema>;

export const LeaderboardEntrySchema = withDocumentLimit(z.object({
  id: UserIdSchema,
  boardId: z.string().min(1).max(128).regex(/^(score|clear:[a-z-]+:(good|neutral|evil))$/),
  userId: UserIdSchema,
  displayName: z.string().min(1).max(128),
  score: CounterSchema,
  characterId: CharacterIdSchema,
  karmaTier: KarmaTierSchema,
  elapsedSeconds: CounterSchema,
  clear: z.boolean(),
  updatedAt: IsoDateTimeSchema,
}).strict());
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;
