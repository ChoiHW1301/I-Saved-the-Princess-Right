import { CurrentRunSaveV1Schema, RunSubmissionSchema, type CurrentRunSaveV1, type RunSubmission } from '@caravan/contracts';

export interface LocalSaveStore {
  get(): Promise<CurrentRunSaveV1 | null>;
  put(value: CurrentRunSaveV1): Promise<void>;
  clear(): Promise<void>;
  getResult(userId: string): Promise<RunSubmission | null>;
  putResult(value: RunSubmission, userId: string): Promise<void>;
  clearResult(): Promise<void>;
}

export class IndexedDbLocalSaveStore implements LocalSaveStore {
  private database: Promise<IDBDatabase> | null = null;
  private open(): Promise<IDBDatabase> {
    if (!globalThis.indexedDB) return Promise.reject(new Error('이 브라우저에서 임시 저장소를 사용할 수 없습니다.'));
    this.database ??= new Promise((resolve, reject) => {
      const request = indexedDB.open('caravan-game-local', 2);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('pending-save')) db.createObjectStore('pending-save');
        if (!db.objectStoreNames.contains('pending-result')) db.createObjectStore('pending-result');
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed.'));
    });
    return this.database;
  }
  private async getValue<T>(store: string): Promise<T | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const request = db.transaction(store, 'readonly').objectStore(store).get('current');
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB read failed.'));
    });
  }
  private async setValue(store: string, value: unknown): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      transaction.objectStore(store).put(value, 'current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB write failed.'));
      transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB write aborted.'));
    });
  }
  private async deleteValue(store: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(store, 'readwrite');
      transaction.objectStore(store).delete('current');
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB delete failed.'));
    });
  }
  async get(): Promise<CurrentRunSaveV1 | null> { const value = await this.getValue<unknown>('pending-save'); return value ? CurrentRunSaveV1Schema.parse(value) : null; }
  async put(value: CurrentRunSaveV1): Promise<void> { await this.setValue('pending-save', CurrentRunSaveV1Schema.parse(value)); }
  async clear(): Promise<void> { await this.deleteValue('pending-save'); }
  async getResult(userId: string): Promise<RunSubmission | null> {
    const value = await this.getValue<unknown>('pending-result');
    if (!value || typeof value !== 'object' || !('userId' in value) || !('submission' in value)) return null;
    const pending = value as { userId: unknown; submission: unknown };
    return pending.userId === userId ? RunSubmissionSchema.parse(pending.submission) : null;
  }
  async putResult(value: RunSubmission, userId: string): Promise<void> { await this.setValue('pending-result', { userId, submission: RunSubmissionSchema.parse(value) }); }
  async clearResult(): Promise<void> { await this.deleteValue('pending-result'); }
}
