import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';
import { authorizeRequest } from '../auth/authorize.js';
import { AuthError } from '../auth/errors.js';

export async function whoami(request: HttpRequest): Promise<HttpResponseInit> {
  try {
    const caller = await authorizeRequest(request);
    return { status: 200, jsonBody: caller };
  } catch (error) {
    if (error instanceof AuthError) {
      return { status: error.status, jsonBody: { code: error.code } };
    }
    throw error;
  }
}

app.http('whoami', {
  methods: ['GET'],
  route: 'me',
  authLevel: 'anonymous',
  handler: whoami,
});
