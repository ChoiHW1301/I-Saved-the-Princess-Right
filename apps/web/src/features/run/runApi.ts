import { CurrentRunSaveV1Schema, RunReceiptSchema, type CurrentRunSaveV1, type PlayerProfile, type RunReceipt, type RunSubmission } from '@caravan/contracts';

export class RunApiError extends Error {
  constructor(readonly status: number, readonly code: string) { super(code); this.name = 'RunApiError'; }
}
async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, ...(init?.body ? { 'Content-Type': 'application/json' } : {}), ...init?.headers } });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { code?: string };
    throw new RunApiError(response.status, payload.code ?? 'REQUEST_FAILED');
  }
  if (response.status === 204) return undefined as T;
  return await response.json() as T;
}

export async function loadSave(token: string): Promise<CurrentRunSaveV1 | null> {
  try { return CurrentRunSaveV1Schema.parse(await request<unknown>('/save', token)); }
  catch (error) { if (error instanceof RunApiError && error.status === 404) return null; throw error; }
}
export async function putSave(token: string, save: Pick<CurrentRunSaveV1, 'runId' | 'snapshot'>, expectedRevision: number | null): Promise<CurrentRunSaveV1> {
  return CurrentRunSaveV1Schema.parse(await request<unknown>('/save', token, { method: 'PUT', body: JSON.stringify({ schemaVersion: 1, runId: save.runId, expectedRevision, snapshot: save.snapshot }) }));
}
export async function deleteSave(token: string): Promise<void> {
  try { await request('/save', token, { method: 'DELETE' }); }
  catch (error) { if (!(error instanceof RunApiError && error.status === 404)) throw error; }
}
export async function submitRun(token: string, result: RunSubmission): Promise<RunReceipt> {
  return RunReceiptSchema.parse(await request<unknown>('/runs', token, { method: 'POST', body: JSON.stringify(result) }));
}
export type { PlayerProfile, RunReceipt, RunSubmission };
