import { z } from 'zod';
import { CharacterIdSchema, PlayerProfileSchema, type PlayerProfile } from './profile.js';
import { BossIdSchema, EndingIdSchema, KarmaTierSchema } from './leaderboard.js';
import { CounterSchema, IdSchema, UserIdSchema, withDocumentLimit } from './validation.js';

export const RunSubmissionSchema = z.object({
  runId: IdSchema,
  characterId: CharacterIdSchema,
  status: z.enum(['won', 'lost']),
  elapsedSeconds: CounterSchema.max(1200),
  kills: CounterSchema.max(10_000),
  defeatedBossIds: z.array(BossIdSchema).max(4).refine((ids) => new Set(ids).size === ids.length),
  karma: z.number().finite().int().min(-100).max(100),
  endingId: EndingIdSchema,
}).strict().superRefine((submission, context) => {
  if ((submission.status === 'lost') !== (submission.endingId === 'caravan-lost')) {
    context.addIssue({ code: 'custom', path: ['endingId'], message: 'Ending does not match run status.' });
  }
  if (submission.status === 'won') {
    const evil = submission.karma <= -50;
    const good = submission.karma >= 50;
    const expectedEnding = evil ? 'warrior-new-demon-king' : good ? 'princess-purified' : 'princess-died';
    const expectedBoss = evil ? 'king-guard' : 'princess-demon';
    if (submission.endingId !== expectedEnding) {
      context.addIssue({ code: 'custom', path: ['endingId'], message: 'Ending does not match final karma.' });
    }
    if (!submission.defeatedBossIds.includes(expectedBoss)) {
      context.addIssue({ code: 'custom', path: ['defeatedBossIds'], message: 'Winning run must include its final boss.' });
    }
  }
});
export type RunSubmission = z.infer<typeof RunSubmissionSchema>;

export interface RunReceipt {
  runId: string;
  score: number;
  goldAward: number;
  unlockedCharacters: Array<'warrior' | 'archer' | 'mage' | 'merchant' | 'dark-warrior'>;
  newlyUnlockedCharacters: Array<'warrior' | 'archer' | 'mage' | 'merchant' | 'dark-warrior'>;
  profile: PlayerProfile;
  scoreBoardUpdated: boolean;
  clearBoardUpdated: boolean;
  replayed: boolean;
}

export const RunReceiptSchema = z.object({
  runId: IdSchema, score: CounterSchema, goldAward: CounterSchema,
  unlockedCharacters: z.array(CharacterIdSchema).max(32), newlyUnlockedCharacters: z.array(CharacterIdSchema).max(32).default([]), profile: PlayerProfileSchema,
  scoreBoardUpdated: z.boolean(), clearBoardUpdated: z.boolean(), replayed: z.boolean(),
}).strict();

export const RunSummarySchema = withDocumentLimit(z.object({
  userId: UserIdSchema,
  runId: IdSchema,
  status: z.enum(['won', 'lost']),
  score: CounterSchema,
  goldAward: CounterSchema,
  characterId: CharacterIdSchema,
  karmaTier: KarmaTierSchema,
  createdAt: z.string().datetime({ offset: true }),
}).strict());
export type RunSummary = z.infer<typeof RunSummarySchema>;
