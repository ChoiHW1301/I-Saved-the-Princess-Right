import {
  CurrentRunSaveV1Schema,
  RunSnapshotV1Schema,
  type CurrentRunSaveV1,
} from '@caravan/contracts';
import { z, ZodError } from 'zod';
import type { Caller } from '../auth/authorize.js';
import type { SaveRepositoryPort } from '../data/saveRepository.js';
import { ApiError } from '../http/responses.js';
import { MAX_DOCUMENT_BYTES } from '@caravan/contracts';

export const SaveWriteRequestSchema = z.object({
  schemaVersion: z.literal(1),
  runId: z.string().min(1).max(128),
  expectedRevision: z.number().int().nonnegative().nullable(),
  snapshot: RunSnapshotV1Schema,
}).strict();

export class SaveService {
  constructor(private readonly saves: SaveRepositoryPort) {}

  async get(caller: Caller): Promise<CurrentRunSaveV1> {
    const save = await this.saves.get(userIdFor(caller));
    if (!save) throw new ApiError(404, 'SAVE_NOT_FOUND');
    return save;
  }

  async put(caller: Caller, input: unknown): Promise<CurrentRunSaveV1> {
    if (typeof input === 'object' && input !== null && 'schemaVersion' in input && (input as { schemaVersion?: unknown }).schemaVersion !== 1) {
      throw new ApiError(400, 'SAVE_VERSION_UNSUPPORTED');
    }
    const parsed = SaveWriteRequestSchema.parse(input);
    const userId = userIdFor(caller);
    const candidate = {
      id: 'current' as const,
      userId,
      schemaVersion: 1 as const,
      revision: parsed.expectedRevision ?? 0,
      runId: parsed.runId,
      savedAt: new Date().toISOString(),
      snapshot: parsed.snapshot,
    };
    try {
      const checked = CurrentRunSaveV1Schema.parse(candidate);
      const size = new TextEncoder().encode(JSON.stringify(checked)).byteLength;
      if (size > MAX_DOCUMENT_BYTES) throw new ApiError(413, 'SAVE_TOO_LARGE');
      return await this.saves.put(checked, parsed.expectedRevision);
    } catch (error) {
      if (error instanceof ApiError) throw error;
      if (error instanceof ZodError && error.issues.some((issue) => issue.message.includes('exceeds 1048576 bytes'))) {
        throw new ApiError(413, 'SAVE_TOO_LARGE');
      }
      throw error;
    }
  }

  async delete(caller: Caller): Promise<void> {
    const userId = userIdFor(caller);
    const existing = await this.saves.get(userId);
    if (!existing) throw new ApiError(404, 'SAVE_NOT_FOUND');
    await this.saves.delete(userId, existing.revision);
  }
}

export function userIdFor(caller: Caller): string {
  return `${caller.tenantId.toLowerCase()}:${caller.objectId.toLowerCase()}`;
}
