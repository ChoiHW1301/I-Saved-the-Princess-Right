import { z } from 'zod';
import { CharacterIdSchema, TrainingIdSchema } from './profile.js';
import { CoordinateSchema, CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

const PlayerSnapshotSchema = z.object({
  x: CoordinateSchema,
  y: CoordinateSchema,
  hp: CounterSchema,
  maxHp: CounterSchema.default(100),
  level: CounterSchema,
  xp: CounterSchema,
  xpToNext: CounterSchema.default(10),
  respawnMs: CounterSchema,
  invulnerableMs: CounterSchema,
}).strict();

const WagonSnapshotSchema = z.object({ hp: CounterSchema, maxHp: CounterSchema }).strict();
const BossSnapshotSchema = z.object({ id: IdSchema, typeId: IdSchema, hp: CounterSchema, maxHp: CounterSchema }).strict();
const EnemySnapshotSchema = z.object({
  id: IdSchema,
  typeId: IdSchema,
  x: CoordinateSchema,
  y: CoordinateSchema,
  hp: CounterSchema,
  attackCooldownMs: CounterSchema,
}).strict();
const ProjectileSnapshotSchema = z.object({
  id: IdSchema,
  ownerId: IdSchema,
  x: CoordinateSchema,
  y: CoordinateSchema,
  vx: CoordinateSchema,
  vy: CoordinateSchema,
  damage: CounterSchema,
  ttlMs: CounterSchema,
}).strict();
const RewardPickupSnapshotSchema = z.object({
  id: IdSchema,
  type: z.enum(['gold', 'experience', 'player-health', 'caravan-repair']),
  x: CoordinateSchema,
  y: CoordinateSchema,
  amount: CounterSchema,
  remainingMs: CounterSchema.max(30_000),
  lifetimeMs: CounterSchema.max(30_000).default(30_000),
  blinkDurationMs: CounterSchema.max(30_000).default(5_000),
}).strict();
const MoneyBombSnapshotSchema = z.object({ id: IdSchema, x: CoordinateSchema, y: CoordinateSchema, remainingMs: CounterSchema.max(3_000) }).strict();

export const RunSnapshotV1Schema = z.object({
  characterId: CharacterIdSchema.default('warrior'),
  worldWidth: CounterSchema.default(1280),
  roadCenterY: CounterSchema.default(267),
  elapsedSeconds: CounterSchema,
  stageId: IdSchema,
  rngSeed: CounterSchema,
  karma: z.number().finite().int().min(-100).max(100),
  status: z.enum(['active', 'won', 'lost']),
  pendingEventId: IdSchema.nullable(),
  approachingEvent: z.object({ eventId: IdSchema, x: CoordinateSchema }).strict().nullable().default(null),
  rewardPickups: z.array(RewardPickupSnapshotSchema).max(100).default([]),
  moneyBombs: z.array(MoneyBombSnapshotSchema).max(20).default([]),
  eventChoiceIds: z.array(IdSchema).max(100),
  ordinarySpawnCooldownMs: CounterSchema,
  activeBoss: BossSnapshotSchema.nullable(),
  player: PlayerSnapshotSchema,
  wagon: WagonSnapshotSchema,
  runGold: CounterSchema,
  kills: CounterSchema.default(0),
  pendingLevelUps: CounterSchema.default(0),
  pendingChoices: z.array(z.object({ id: IdSchema, nextLevel: CounterSchema, value: z.number().finite() }).strict()).max(3).default([]),
  weaponLevels: z.record(IdSchema, CounterSchema),
  upgradeStats: z.record(IdSchema, z.number().finite()).default({}).transform((stats) => Object.fromEntries(
    Object.entries(stats).map(([id, value]) => [id.startsWith('hero-') ? `warrior-${id.slice(5)}` : id, value]),
  )),
  trainingLevels: z.partialRecord(TrainingIdSchema, CounterSchema).default({}),
  activeAbilityCooldownMs: CounterSchema.default(0),
  dashRemainingMs: CounterSchema.default(0),
  dashDirection: z.object({ x: CoordinateSchema, y: CoordinateSchema }).strict().default({ x: 1, y: 0 }),
  upgradeIds: z.array(IdSchema).max(100).transform((ids) => ids.map((id) => id.startsWith('hero-') ? `warrior-${id.slice(5)}` : id)),
  defeatedBossIds: z.array(IdSchema).max(100),
  enemies: z.array(EnemySnapshotSchema).max(500),
  projectiles: z.array(ProjectileSnapshotSchema).max(500),
}).strict();
export type RunSnapshotV1 = z.infer<typeof RunSnapshotV1Schema>;

export const CurrentRunSaveV1Schema = withDocumentLimit(z.object({
  id: z.literal('current'),
  userId: UserIdSchema,
  schemaVersion: z.literal(1),
  revision: CounterSchema,
  runId: IdSchema,
  savedAt: IsoDateTimeSchema,
  snapshot: RunSnapshotV1Schema,
}).strict());

export type CurrentRunSaveV1 = z.infer<typeof CurrentRunSaveV1Schema>;

export const SaveEnvelopeSchema = z.discriminatedUnion('schemaVersion', [CurrentRunSaveV1Schema]);
