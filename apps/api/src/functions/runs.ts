import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { authorizeRequest } from '../auth/authorize.js';
import { LeaderboardRepository } from '../data/leaderboardRepository.js';
import { ProfileRepository } from '../data/profileRepository.js';
import { SaveRepository } from '../data/saveRepository.js';
import type { RunServiceDependencies } from '../services/runService.js';
import { RunService } from '../services/runService.js';
import { correlationIdFor, jsonError, readJson } from '../http/responses.js';

export async function postRun(
  request: HttpRequest,
  dependencies?: RunServiceDependencies,
): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    const resolved = dependencies ?? {
      profiles: new ProfileRepository(),
      leaderboards: new LeaderboardRepository(),
      saves: new SaveRepository(),
    };
    const result = await new RunService(resolved).submitRun(caller, await readJson(request), correlationIdFor(request));
    return { status: result.replayed ? 200 : 201, jsonBody: result };
  } catch (error) {
    return jsonError(error, request);
  }
}

app.http('runSubmit', {
  methods: ['POST'], route: 'runs', authLevel: 'anonymous', handler: (request) => postRun(request),
});
