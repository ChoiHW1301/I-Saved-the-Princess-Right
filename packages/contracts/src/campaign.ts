import { z } from 'zod';
import { BossIdSchema, EndingIdSchema, KarmaTierSchema } from './leaderboard.js';
import { CharacterIdSchema } from './profile.js';

export { BossIdSchema, EndingIdSchema, KarmaTierSchema } from './leaderboard.js';
export type { BossId, EndingId, KarmaTier } from './leaderboard.js';

export const RunEndingSummarySchema = z.object({
  runId: z.string().min(1).max(128),
  status: z.enum(['won', 'lost']),
  endingId: EndingIdSchema,
  karma: z.number().int().min(-100).max(100),
  karmaTier: KarmaTierSchema,
  elapsedSeconds: z.number().finite().nonnegative(),
  kills: z.number().int().nonnegative(),
  runGold: z.number().int().nonnegative(),
  characterId: CharacterIdSchema,
  defeatedBossIds: z.array(BossIdSchema).max(4),
}).strict();
export type RunEndingSummary = z.infer<typeof RunEndingSummarySchema>;
