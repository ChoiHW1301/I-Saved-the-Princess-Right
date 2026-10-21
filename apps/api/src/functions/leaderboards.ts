import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { LeaderboardRepository, type LeaderboardRepositoryPort } from '../data/leaderboardRepository.js';
import { authorizeRequest } from '../auth/authorize.js';
import { jsonError } from '../http/responses.js';
import { LeaderboardService } from '../services/leaderboardService.js';

function parseLimit(request: HttpRequest): number {
  const raw = request.query.get('limit');
  if (raw === null) return 10;
  if (!/^\d+$/.test(raw)) return Number.NaN;
  return Number(raw);
}

export async function getScoreBoard(
  request: HttpRequest,
  repository?: LeaderboardRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const service = new LeaderboardService(repository ?? new LeaderboardRepository());
    return { status: 200, jsonBody: await service.scoreBoard(caller, parseLimit(request)) };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function getClearBoard(
  request: HttpRequest,
  repository?: LeaderboardRepositoryPort,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const service = new LeaderboardService(repository ?? new LeaderboardRepository());
    return {
      status: 200,
      jsonBody: await service.clearBoard(
        caller,
        request.query.get('characterId') ?? '',
        request.query.get('karmaTier') ?? '',
        parseLimit(request),
      ),
    };
  } catch (error) {
    return jsonError(error, request);
  }
}

app.http('scoreLeaderboard', {
  methods: ['GET'], route: 'leaderboards/score', authLevel: 'anonymous', handler: (request) => getScoreBoard(request),
});

app.http('clearLeaderboard', {
  methods: ['GET'], route: 'leaderboards/clears', authLevel: 'anonymous', handler: (request) => getClearBoard(request),
});
