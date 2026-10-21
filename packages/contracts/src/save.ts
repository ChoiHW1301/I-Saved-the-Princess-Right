import { z } from 'zod';
import { CharacterIdSchema } from './profile.js';
import { CoordinateSchema, CounterSchema, IdSchema, IsoDateTimeSchema, UserIdSchema, withDocumentLimit } from './validation.js';

const PlayerSnapshotSchema = z.object({
  x: CoordinateSchema,
  y: CoordinateSchema,
  hp: CounterSchema,
  level: CounterSchema,
  xp: CounterSchema,
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

export const RunSnapshotV1Schema = z.object({
  elapsedSeconds: CounterSchema,
  stageId: IdSchema,
  rngSeed: CounterSchema,
  karma: z.number().finite().int().min(-100).max(100),
  status: z.enum(['active', 'won', 'lost']),
  pendingEventId: IdSchema.nullable(),
  eventChoiceIds: z.array(IdSchema).max(100),
  ordinarySpawnCooldownMs: CounterSchema,
  activeBoss: BossSnapshotSchema.nullable(),
  player: PlayerSnapshotSchema,
  wagon: WagonSnapshotSchema,
  runGold: CounterSchema,
  weaponLevels: z.record(IdSchema, CounterSchema),
  upgradeIds: z.array(IdSchema).max(100),
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
