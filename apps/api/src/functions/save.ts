import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { SaveRepository, type SaveRepositoryPort } from '../data/saveRepository.js';
import { ApiError, jsonError, readJson } from '../http/responses.js';
import { authorizeRequest } from '../auth/authorize.js';
import { SaveService } from '../services/saveService.js';
import { MAX_DOCUMENT_BYTES } from '@caravan/contracts';

function bodyTooLarge(request: HttpRequest): boolean {
  const length = Number(request.headers.get('content-length'));
  return Number.isFinite(length) && length > MAX_DOCUMENT_BYTES;
}

export async function getSave(request: HttpRequest, repository?: SaveRepositoryPort): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    return { status: 200, jsonBody: await new SaveService(repository ?? new SaveRepository()).get(caller) };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function putSave(request: HttpRequest, repository?: SaveRepositoryPort): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    if (bodyTooLarge(request)) throw new ApiError(413, 'SAVE_TOO_LARGE');
    const body = await readJson(request);
    return { status: 200, jsonBody: await new SaveService(repository ?? new SaveRepository()).put(caller, body) };
  } catch (error) {
    return jsonError(error, request);
  }
}

export async function deleteSave(request: HttpRequest, repository?: SaveRepositoryPort): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    await new SaveService(repository ?? new SaveRepository()).delete(caller);
    return { status: 204 };
  } catch (error) {
    return jsonError(error, request);
  }
}

app.http('saveGet', {
  methods: ['GET'], route: 'save', authLevel: 'anonymous', handler: (request) => getSave(request),
});

app.http('savePut', {
  methods: ['PUT'], route: 'save', authLevel: 'anonymous', handler: (request) => putSave(request),
});

app.http('saveDelete', {
  methods: ['DELETE'], route: 'save', authLevel: 'anonymous', handler: (request) => deleteSave(request),
});
