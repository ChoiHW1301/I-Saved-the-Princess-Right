import { app } from '@azure/functions';

app.http('health', {
  methods: ['GET'],
  route: 'health',
  authLevel: 'anonymous',
  handler: async () => ({ jsonBody: { status: 'ok' } }),
});
