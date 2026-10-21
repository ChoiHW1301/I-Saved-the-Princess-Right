export interface ItemResponse<T> {
  resource?: T;
  etag?: string;
}

export interface ItemPort {
  read<T>(): Promise<ItemResponse<T>>;
  replace<T>(resource: T, options?: { ifMatch?: string }): Promise<ItemResponse<T>>;
  delete(options?: { ifMatch?: string }): Promise<unknown>;
}

export interface BatchResponse {
  statusCode?: number;
  result?: Array<{ statusCode?: number }>;
}

export interface BatchPort {
  create<T>(document: T): BatchPort;
  replace<T>(id: string, document: T, options?: { ifMatch?: string }): BatchPort;
  execute(): Promise<BatchResponse>;
}

export interface ContainerPort {
  item(id: string, partitionKey: string): ItemPort;
  items: {
    create<T>(document: T): Promise<ItemResponse<T>>;
    upsert<T>(document: T): Promise<ItemResponse<T>>;
    query<T>(
      spec: { query: string; parameters?: Array<{ name: string; value: unknown }> },
      options?: { partitionKey?: string },
    ): {
      fetchAll(): Promise<{ resources: T[] }>;
    };
    batch(partitionKey: string): BatchPort;
  };
}

export class StorageError extends Error {
  constructor(readonly code: 'SAVE_CONFLICT' | 'PROFILE_CONFLICT' | 'STORAGE_UNAVAILABLE') {
    super(code);
    this.name = 'StorageError';
  }
}

export function cosmosStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const candidate = error as { statusCode?: number; code?: number | string };
  if (typeof candidate.statusCode === 'number') return candidate.statusCode;
  const code = Number(candidate.code);
  return Number.isFinite(code) ? code : undefined;
}

export function mapStorageFailure(error: unknown, conflictCode?: 'SAVE_CONFLICT' | 'PROFILE_CONFLICT'): never {
  const status = cosmosStatus(error);
  if (status === 412 && conflictCode) throw new StorageError(conflictCode);
  throw new StorageError('STORAGE_UNAVAILABLE');
}

export function asContainer(container: unknown): ContainerPort {
  return container as ContainerPort;
}
