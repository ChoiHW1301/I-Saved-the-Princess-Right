import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest } from '@azure/functions';
import { exportJWK, generateKeyPair, SignJWT, type JWK } from 'jose';
import { authorizeRequest } from '../../src/auth/authorize.js';

const TENANT_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_TENANT_ID = '22222222-2222-4222-8222-222222222222';
const API_CLIENT_ID = '33333333-3333-4333-8333-333333333333';
const OBJECT_ID = '44444444-4444-4444-8444-444444444444';
const KEY_ID = 'caravan-test-key';

let privateKey: CryptoKey;
let publicJwk: JWK;

function request(token?: string): HttpRequest {
  const headers: Record<string, string> = {};
  if (token) headers.authorization = `Bearer ${token}`;
  return new HttpRequest({
    url: 'http://localhost/api/me',
    method: 'GET',
    headers,
  });
}

async function createToken(overrides: {
  tenantId?: string;
  audience?: string;
  roles?: string[];
  expired?: boolean;
} = {}): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const tenantId = overrides.tenantId ?? TENANT_ID;
  return new SignJWT({
    tid: tenantId,
    oid: OBJECT_ID,
    name: 'DEX Test Player',
    roles: overrides.roles ?? ['CaravanGame.Player'],
  })
    .setProtectedHeader({ alg: 'RS256', kid: KEY_ID, typ: 'JWT' })
    .setIssuer(`https://login.microsoftonline.com/${tenantId}/v2.0`)
    .setAudience(overrides.audience ?? API_CLIENT_ID)
    .setIssuedAt(now - 60)
    .setExpirationTime(overrides.expired ? now - 10 : now + 300)
    .sign(privateKey);
}

beforeAll(async () => {
  const pair = await generateKeyPair('RS256', { modulusLength: 2048 });
  privateKey = pair.privateKey;
  publicJwk = {
    ...(await exportJWK(pair.publicKey)),
    kid: KEY_ID,
    alg: 'RS256',
    use: 'sig',
  };
});

beforeEach(() => {
  vi.stubEnv('ENTRA_TENANT_ID', TENANT_ID);
  vi.stubEnv('ENTRA_API_AUDIENCE', API_CLIENT_ID);
  vi.stubEnv('COSMOS_ENDPOINT', 'https://example.documents.azure.com:443/');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [publicJwk] }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('authorizeRequest', () => {
  it('rejects a missing bearer token with 401', async () => {
    await expect(authorizeRequest(request())).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects an expired token with 401', async () => {
    await expect(authorizeRequest(request(await createToken({ expired: true })))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a token from a different tenant with 401', async () => {
    await expect(authorizeRequest(request(await createToken({ tenantId: OTHER_TENANT_ID })))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a token for a different audience with 401', async () => {
    await expect(authorizeRequest(request(await createToken({ audience: 'not-the-api' })))).rejects.toMatchObject({
      status: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a valid token without the player role with 403', async () => {
    await expect(authorizeRequest(request(await createToken({ roles: [] })))).rejects.toMatchObject({
      status: 403,
      code: 'FORBIDDEN',
    });
  });

  it('returns caller identity only from a verified token', async () => {
    await expect(authorizeRequest(request(await createToken()))).resolves.toEqual({
      tenantId: TENANT_ID,
      objectId: OBJECT_ID,
      displayName: 'DEX Test Player',
    });
  });
});
