import type { CharacterId, CurrentRunSaveV1, PlayerProfile, RunReceipt, RunSnapshotV1, RunSubmission } from '@caravan/contracts';
import { deleteSave, loadSave, putSave, RunApiError, submitRun } from './runApi.js';
import { IndexedDbLocalSaveStore, type LocalSaveStore } from './localSaveStore.js';

export type SyncStatus = 'clean' | 'pending' | 'conflict';
export class RunControllerError extends Error {
  constructor(readonly kind: 'conflict' | 'offline' | 'auth' | 'access' | 'unknown', message: string) { super(message); this.name = 'RunControllerError'; }
}

export class RunController {
  private current: CurrentRunSaveV1 | null = null;
  private profile: PlayerProfile;
  syncStatus: SyncStatus = 'clean';
  constructor(private readonly getToken: () => Promise<string>, profile: PlayerProfile, private readonly local: LocalSaveStore = new IndexedDbLocalSaveStore()) { this.profile = profile; }
  setProfile(profile: PlayerProfile): void { this.profile = profile; }

  async startNew(characterId: CharacterId): Promise<{ runId: string }> {
    if (!this.profile.unlockedCharacters.includes(characterId)) throw new RunControllerError('access', '선택한 캐릭터가 아직 해금되지 않았습니다.');
    try { await deleteSave(await this.getToken()); }
    catch (error) { if (!(error instanceof RunApiError && error.status === 404)) throw this.toControllerError(error); }
    await this.local.clear();
    this.current = null; this.syncStatus = 'clean';
    return { runId: globalThis.crypto?.randomUUID?.() ?? `run-${Date.now()}-${Math.floor(Math.random() * 1e8)}` };
  }

  async continueRun(): Promise<CurrentRunSaveV1> {
    let local = await this.local.get();
    if (local && local.userId !== this.profile.userId) local = null;
    let remote: CurrentRunSaveV1 | null;
    try { remote = await loadSave(await this.getToken()); }
    catch (error) {
      if (local) { this.current = local; this.syncStatus = 'pending'; return local; }
      throw this.toControllerError(error);
    }
    if (local) {
      if (remote && remote.runId !== local.runId) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 저장과 이 기기의 임시 저장이 서로 다른 원정입니다. 서버 저장을 유지했습니다.'); }
      if (!remote) {
        if (local.revision !== 0) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 원정 저장이 없어 임시 저장의 기준 리비전을 확인할 수 없습니다.'); }
        try { return await this.uploadLocal(local, null); }
        catch (error) { if (error instanceof RunControllerError && error.kind === 'offline') { this.current = local; this.syncStatus = 'pending'; return local; } throw error; }
      }
      if (local.revision === remote.revision && sameSnapshot(remote.snapshot, local.snapshot)) await this.local.clear();
      else if (local.revision + 1 === remote.revision && sameSnapshot(remote.snapshot, local.snapshot)) await this.local.clear();
      else if (local.revision === remote.revision) {
        try { return await this.uploadLocal(local, remote.revision); }
        catch (error) { if (error instanceof RunControllerError && error.kind === 'offline') { this.current = local; this.syncStatus = 'pending'; return local; } throw error; }
      } else { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버와 임시 저장의 리비전이 맞지 않습니다. 서버 저장을 유지했습니다.'); }
    }
    const save = remote ?? local;
    if (!save) throw new RunControllerError('unknown', '이어갈 원정 저장이 없습니다.');
    this.current = save; this.syncStatus = local && save === local ? 'pending' : 'clean';
    return save;
  }

  async saveSnapshot(runId: string, snapshot: RunSnapshotV1): Promise<CurrentRunSaveV1> {
    const currentRevision = this.current?.runId === runId ? this.current.revision : null;
    const expectedRevision = currentRevision && currentRevision > 0 ? currentRevision : null;
    try {
      const saved = await putSave(await this.getToken(), { runId, snapshot }, expectedRevision);
      this.current = saved; this.syncStatus = 'clean'; await this.local.clear();
      return saved;
    } catch (error) {
      if (error instanceof RunApiError && error.status === 409) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 저장이 다른 요청에서 변경되었습니다. 동기화 전까지 게임을 멈췄습니다.'); }
      const fallback: CurrentRunSaveV1 = {
        id: 'current', userId: this.profile.userId, schemaVersion: 1,
        revision: expectedRevision ?? 0, runId, savedAt: new Date().toISOString(), snapshot,
      };
      try { await this.local.put(fallback); this.current = fallback; this.syncStatus = 'pending'; }
      catch { throw new RunControllerError('offline', '연결이 끊겼고 이 기기에도 임시 저장할 수 없습니다. 게임을 멈췄습니다.'); }
      throw new RunControllerError('offline', '연결이 끊겨 이 기기에 임시 저장했습니다. 다시 연결되면 동기화하세요.');
    }
  }

  async pauseForNetwork(runId: string, snapshot: RunSnapshotV1): Promise<void> { try { await this.saveSnapshot(runId, snapshot); } catch { /* The scene remains paused until resumeAfterSync succeeds. */ } }

  async resumeAfterSync(): Promise<CurrentRunSaveV1> {
    const local = await this.local.get();
    if (!local) {
      if (this.syncStatus === 'conflict') throw new RunControllerError('conflict', '저장 충돌이 있어 게임을 재개할 수 없습니다. 야영지에서 서버 저장을 불러오세요.');
      throw new RunControllerError('unknown', '동기화할 임시 저장이 없습니다.');
    }
    let remote: CurrentRunSaveV1 | null;
    try { remote = await loadSave(await this.getToken()); } catch (error) { throw this.toControllerError(error); }
    if (remote && remote.runId !== local.runId) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 저장과 임시 저장이 다른 원정입니다. 서버 저장을 유지했습니다.'); }
    if (remote && remote.revision === local.revision + 1 && sameSnapshot(remote.snapshot, local.snapshot)) {
      await this.local.clear(); this.current = remote; this.syncStatus = 'clean'; return remote;
    }
    if (remote && remote.revision === local.revision && sameSnapshot(remote.snapshot, local.snapshot)) {
      await this.local.clear(); this.current = remote; this.syncStatus = 'clean'; return remote;
    }
    if ((remote?.revision ?? null) !== (local.revision || null)) {
      if (!(remote === null && local.revision === 0)) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 저장이 더 최신이거나 충돌했습니다. 임시 저장은 보존했습니다.'); }
    }
    return this.uploadLocal(local, remote?.revision ?? null);
  }

  async submitResult(result: RunSubmission): Promise<RunReceipt> {
    await this.local.putResult(result, this.profile.userId);
    try {
      const receipt = await submitRun(await this.getToken(), result);
      this.current = null; this.syncStatus = 'clean';
      await Promise.all([this.local.clear(), this.local.clearResult()]);
      return receipt;
    } catch (error) { throw this.toControllerError(error); }
  }

  async retryResult(): Promise<RunReceipt> {
    const pending = await this.local.getResult(this.profile.userId);
    if (!pending) throw new RunControllerError('unknown', '다시 제출할 판 결과가 없습니다.');
    return this.submitResult(pending);
  }
  async getPendingResult(): Promise<RunSubmission | null> { return this.local.getResult(this.profile.userId); }
  async discardLocalConflict(): Promise<void> {
    if (this.syncStatus !== 'conflict') throw new RunControllerError('unknown', '서버 저장 충돌 상태가 아닙니다.');
    await this.local.clear(); this.current = null; this.syncStatus = 'clean';
  }

  private async uploadLocal(local: CurrentRunSaveV1, expectedRevision: number | null): Promise<CurrentRunSaveV1> {
    try {
      const saved = await putSave(await this.getToken(), local, expectedRevision);
      this.current = saved; this.syncStatus = 'clean'; await this.local.clear(); return saved;
    } catch (error) {
      if (error instanceof RunApiError && error.status === 409) { this.syncStatus = 'conflict'; throw new RunControllerError('conflict', '서버 저장이 더 최신입니다. 임시 저장은 보존했습니다.'); }
      throw this.toControllerError(error);
    }
  }
  private toControllerError(error: unknown): RunControllerError {
    if (error instanceof RunControllerError) return error;
    if (error instanceof RunApiError) {
      if (error.status === 401) return new RunControllerError('auth', '로그인 세션이 만료되었습니다. 다시 인증해 주세요.');
      if (error.status === 403) return new RunControllerError('access', 'DEX 직원 계정의 게임 이용 권한을 확인해 주세요.');
      if (error.status === 409) return new RunControllerError('conflict', '저장 또는 판 결과가 다른 요청과 충돌했습니다.');
    }
    return new RunControllerError('offline', 'API에 연결하지 못했습니다. 연결 상태를 확인해 주세요.');
  }
}

function sameSnapshot(left: RunSnapshotV1, right: RunSnapshotV1): boolean { return JSON.stringify(left) === JSON.stringify(right); }
