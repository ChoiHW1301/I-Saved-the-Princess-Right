import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { authorizeRequest } from '../auth/authorize.js';
import { jsonError } from '../http/responses.js';

export async function whoami(request: HttpRequest): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    return { status: 200, jsonBody: caller };
  } catch (error) {
    return jsonError(error, request);
  }
}

app.http('whoami', {
  methods: ['GET'],
  route: 'me',
  authLevel: 'anonymous',
  handler: whoami,
});
