import { z } from 'zod';

export const MAX_DOCUMENT_BYTES = 1024 * 1024;

export const IdSchema = z.string().min(1).max(128).regex(/^[A-Za-z0-9][A-Za-z0-9:_-]*$/);
export const UserIdSchema = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);
export const IsoDateTimeSchema = z.string().datetime({ offset: true });
export const CounterSchema = z.number().finite().int().nonnegative();
export const CoordinateSchema = z.number().finite();

export function withDocumentLimit<T extends z.ZodType>(schema: T): T {
  return schema.superRefine((value, context) => {
    const bytes = new TextEncoder().encode(JSON.stringify(value)).byteLength;
    if (bytes > MAX_DOCUMENT_BYTES) {
      context.addIssue({ code: 'custom', message: `Document exceeds ${MAX_DOCUMENT_BYTES} bytes.` });
    }
  }) as T;
}
