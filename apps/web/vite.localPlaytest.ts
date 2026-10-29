import type { Plugin } from 'vite';
import {
  CurrentRunSaveV1Schema,
  CharacterIdSchema,
  PlayerProfileSchema,
  RunSubmissionSchema,
  TrainingIdSchema,
  characterTrainingCatalog,
  commonUpgradeCatalog,
  type CharacterId,
  type KarmaTier,
  type PlayerProfile,
  type RunSubmission,
} from '@caravan/contracts';

const tenantId = '11111111-1111-4111-8111-111111111111';
const objectId = '22222222-2222-4222-8222-222222222222';
const userId = `${tenantId}:${objectId}`;
const displayName = 'Local Playtester';
const merchantRecruitCost = 10_000;

type BoardEntry = {
  id: string; boardId: string; userId: string; displayName: string; score: number; kills: number;
  characterId: CharacterId; karmaTier: KarmaTier; elapsedSeconds: number; clear: boolean; updatedAt: string;
};

export function localPlaytestApi(): Plugin {
  let profile = PlayerProfileSchema.parse({
    id: 'profile', userId, tenantId, objectId, version: 1, displayName,
    goldBalance: 350, lifetimeGoldEarned: 0, unlockedCharacters: ['warrior'],
    permanentUpgradeLevels: {}, characterTrainingLevels: {}, passiveIds: [], updatedAt: new Date().toISOString(),
  });
  let save: ReturnType<typeof CurrentRunSaveV1Schema.parse> | null = null;
  const boards = new Map<string, BoardEntry>();
  const receipts = new Map<string, { submission: RunSubmission; receipt: unknown }>();

  function json(response: any, status: number, value: unknown): void {
    response.statusCode = status;
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.end(JSON.stringify(value));
  }

  function currentProfile(next: PlayerProfile): PlayerProfile {
    profile = PlayerProfileSchema.parse(next);
    return profile;
  }

  function boardResponse(boardId: string, limit: number): unknown {
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) return { error: 400, body: { code: 'INVALID_LEADERBOARD_FILTER' } };
    const sorted = [...boards.values()].filter((entry) => entry.boardId === boardId)
      .sort((a, b) => b.score - a.score || b.kills - a.kills || b.elapsedSeconds - a.elapsedSeconds || a.displayName.localeCompare(b.displayName));
    const index = sorted.findIndex((entry) => entry.userId === userId);
    return {
      entries: sorted.slice(0, limit).map(({ userId: _userId, id: _id, boardId: _boardId, ...entry }, rank) => ({ ...entry, rank: rank + 1 })),
      myRank: index < 0 ? null : index + 1,
      totalEntries: sorted.length,
    };
  }

  async function handle(request: any, response: any, next: () => void): Promise<void> {
    const originalUrl = request.originalUrl ?? request.url ?? '/';
    const url = new URL(originalUrl, 'http://localhost');
    const path = url.pathname.replace(/^\/api(?=\/|$)/, '');
    const method = request.method ?? 'GET';
    if (path === '/health' && method === 'GET') return json(response, 200, { status: 'ok' });
    if (!originalUrl.startsWith('/api/') || (request.headers?.authorization !== 'Bearer local-playtest-token')) return json(response, 401, { code: 'UNAUTHENTICATED' });

    try {
      if (path === '/me' && method === 'GET') return json(response, 200, { tenantId, objectId, displayName });
      if (path === '/profile' && method === 'GET') return json(response, 200, profile);
      if (path === '/profile/upgrades' && method === 'POST') {
        const body = await readBody(request);
        const id = body.upgradeId as keyof typeof commonUpgradeCatalog;
        const rule = commonUpgradeCatalog[id];
        if (!rule) return json(response, 400, { code: 'INVALID_UPGRADE' });
        if (body.expectedProfileVersion !== profile.version) return json(response, 409, { code: 'PROFILE_CONFLICT' });
        const level = profile.permanentUpgradeLevels[id] ?? 0;
        if (level >= rule.maxLevel) return json(response, 400, { code: 'INVALID_UPGRADE' });
        const cost = rule.rankCosts[level];
        if (cost === undefined) return json(response, 400, { code: 'INVALID_UPGRADE' });
        if (profile.goldBalance < cost) return json(response, 409, { code: 'INSUFFICIENT_GOLD' });
        return json(response, 200, currentProfile({ ...profile, version: profile.version + 1, goldBalance: profile.goldBalance - cost, permanentUpgradeLevels: { ...profile.permanentUpgradeLevels, [id]: level + 1 }, updatedAt: new Date().toISOString() }));
      }
      if (path === '/profile/trainings' && method === 'POST') {
        const body = await readBody(request);
        const parsedCharacter = CharacterIdSchema.safeParse(body.characterId);
        const parsedTraining = TrainingIdSchema.safeParse(body.trainingId);
        if (!parsedCharacter.success || !parsedTraining.success) return json(response, 400, { code: 'INVALID_UPGRADE' });
        if (body.expectedProfileVersion !== profile.version) return json(response, 409, { code: 'PROFILE_CONFLICT' });
        if (!profile.unlockedCharacters.includes(parsedCharacter.data)) return json(response, 400, { code: 'INVALID_UPGRADE' });
        const definition = characterTrainingCatalog[parsedTraining.data];
        if (definition.characterId !== parsedCharacter.data) return json(response, 400, { code: 'INVALID_UPGRADE' });
        const level = profile.characterTrainingLevels[parsedCharacter.data]?.[parsedTraining.data] ?? 0;
        if (level >= definition.maxLevel) return json(response, 400, { code: 'INVALID_UPGRADE' });
        const cost = definition.rankCosts[level];
        if (cost === undefined) return json(response, 400, { code: 'INVALID_UPGRADE' });
        if (profile.goldBalance < cost) return json(response, 409, { code: 'INSUFFICIENT_GOLD' });
        return json(response, 200, currentProfile({ ...profile, version: profile.version + 1, goldBalance: profile.goldBalance - cost, characterTrainingLevels: { ...profile.characterTrainingLevels, [parsedCharacter.data]: { ...profile.characterTrainingLevels[parsedCharacter.data], [parsedTraining.data]: level + 1 } }, updatedAt: new Date().toISOString() }));
      }
      if (path === '/profile/characters/merchant' && method === 'POST') {
        const body = await readBody(request);
        if (body.expectedProfileVersion !== profile.version) return json(response, 409, { code: 'PROFILE_CONFLICT' });
        if (profile.unlockedCharacters.includes('merchant')) return json(response, 400, { code: 'INVALID_UPGRADE' });
        if (profile.goldBalance < merchantRecruitCost) return json(response, 409, { code: 'INSUFFICIENT_GOLD' });
        return json(response, 200, currentProfile({ ...profile, version: profile.version + 1, goldBalance: profile.goldBalance - merchantRecruitCost, unlockedCharacters: [...profile.unlockedCharacters, 'merchant'], updatedAt: new Date().toISOString() }));
      }
      if (path === '/save' && method === 'GET') return save ? json(response, 200, save) : json(response, 404, { code: 'SAVE_NOT_FOUND' });
      if (path === '/save' && method === 'DELETE') {
        save = null;
        response.statusCode = 204;
        return response.end();
      }
      if (path === '/save' && method === 'PUT') {
        const body = await readBody(request);
        const currentRevision = save?.revision ?? null;
        if (body.expectedRevision !== currentRevision) return json(response, 409, { code: 'SAVE_CONFLICT' });
        save = CurrentRunSaveV1Schema.parse({
          id: 'current', userId, schemaVersion: 1, revision: (currentRevision ?? 0) + 1,
          runId: body.runId, savedAt: new Date().toISOString(), snapshot: body.snapshot,
        });
        return json(response, 200, save);
      }
      if (path === '/runs' && method === 'POST') {
        const submission = RunSubmissionSchema.parse(await readBody(request));
        const prior = receipts.get(submission.runId);
        if (prior) return json(response, 200, { ...(prior.receipt as object), replayed: true });
        if (!profile.unlockedCharacters.includes(submission.characterId)) return json(response, 400, { code: 'INVALID_RUN' });
        const now = new Date().toISOString();
        const karmaTier: KarmaTier = submission.karma <= -50 ? 'evil' : submission.karma >= 50 ? 'good' : 'neutral';
        const score = submission.kills * 100 + submission.elapsedSeconds + submission.defeatedBossIds.length * 500 + (submission.status === 'won' ? 2000 : 0);
        const goldAward = submission.kills + Math.floor(submission.elapsedSeconds / 60) * 5 + (submission.status === 'won' ? 50 : 0);
        const unlockedCharacters = new Set<CharacterId>(profile.unlockedCharacters);
        unlockedCharacters.add('archer');
        if (submission.status === 'won') unlockedCharacters.add('mage');
        const updatedProfile = currentProfile({ ...profile, version: profile.version + 1, goldBalance: profile.goldBalance + goldAward, lifetimeGoldEarned: profile.lifetimeGoldEarned + goldAward, unlockedCharacters: [...unlockedCharacters], updatedAt: now });
        const newlyUnlockedCharacters = [...unlockedCharacters].filter((id) => !profile.unlockedCharacters.includes(id));
        const scoreEntry: BoardEntry = { id: userId, boardId: 'score', userId, displayName, score, kills: submission.kills, characterId: submission.characterId, karmaTier, elapsedSeconds: submission.elapsedSeconds, clear: submission.status === 'won', updatedAt: now };
        updateBest(scoreEntry);
        if (submission.status === 'won') updateBest({ ...scoreEntry, boardId: `clear:${submission.characterId}:${karmaTier}` });
        if (save?.runId === submission.runId) save = null;
        const receipt = { runId: submission.runId, score, goldAward, unlockedCharacters: [...unlockedCharacters], newlyUnlockedCharacters, profile: updatedProfile, scoreBoardUpdated: true, clearBoardUpdated: submission.status === 'won', replayed: false };
        receipts.set(submission.runId, { submission, receipt });
        return json(response, 201, receipt);
      }
      if (path === '/leaderboards/score' && method === 'GET') {
        const result = boardResponse('score', Number(url.searchParams.get('limit') ?? 10)) as any;
        return result.error ? json(response, result.error, result.body) : json(response, 200, result);
      }
      if (path === '/leaderboards/clears' && method === 'GET') {
        const boardId = `clear:${url.searchParams.get('characterId')}:${url.searchParams.get('karmaTier')}`;
        const result = boardResponse(boardId, Number(url.searchParams.get('limit') ?? 10)) as any;
        return result.error ? json(response, result.error, result.body) : json(response, 200, result);
      }
      return next();
    } catch (error) {
      const code = error instanceof Error ? error.message : 'INVALID_REQUEST';
      return json(response, 400, { code: code === 'Unexpected end of JSON input' ? 'INVALID_REQUEST' : 'INVALID_REQUEST' });
    }
  }

  function updateBest(candidate: BoardEntry): void {
    const key = `${candidate.boardId}:${candidate.userId}`;
    const existing = boards.get(key);
    if (!existing || candidate.score > existing.score || (candidate.score === existing.score && candidate.kills > existing.kills)) boards.set(key, candidate);
  }

  return {
    name: 'local-playtest-api',
    configureServer(server) {
      server.middlewares.use('/api', (request: any, response: any, next: () => void) => { void handle(request, response, next); });
    },
  };
}

function readBody(request: any): Promise<Record<string, any>> {
  return new Promise((resolve, reject) => {
    let text = '';
    request.on('data', (chunk: Buffer) => { text += chunk.toString('utf8'); });
    request.on('end', () => {
      try { resolve(JSON.parse(text) as Record<string, any>); }
      catch { reject(new Error('INVALID_REQUEST')); }
    });
    request.on('error', reject);
  });
}
