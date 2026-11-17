import { HttpRequest } from '@azure/functions';
import { createRemoteJWKSet, decodeJwt, errors, jwtVerify } from 'jose';
import { readAuthConfig } from '../config/env.js';
import { AuthError } from './errors.js';

export interface Caller {
  tenantId: string;
  objectId: string;
  displayName: string;
}

const PLAYER_ROLE = 'CaravanGame.Player';
type TokenVersion = '1.0' | '2.0';
const jwksByTenantAndVersion = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(tenantId: string, version: TokenVersion): ReturnType<typeof createRemoteJWKSet> {
  const cacheKey = `${tenantId}:${version}`;
  let jwks = jwksByTenantAndVersion.get(cacheKey);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(version === '1.0'
        ? `https://login.microsoftonline.com/${tenantId}/discovery/keys`
        : `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
    );
    jwksByTenantAndVersion.set(cacheKey, jwks);
  }
  return jwks;
}

export async function authorizeRequest(request: HttpRequest): Promise<Caller> {
  const config = readAuthConfig();
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match?.[1]) {
    throw new AuthError(401, 'UNAUTHENTICATED');
  }

  let payload;
  try {
    // The unverified version only selects the strict validator below; it never grants access.
    const version = decodeJwt(match[1]).ver;
    if (version !== '1.0' && version !== '2.0') throw new AuthError(401, 'UNAUTHENTICATED');
    ({ payload } = await jwtVerify(match[1], getJwks(config.tenantId, version), {
      algorithms: ['RS256'],
      issuer: version === '1.0'
        ? `https://sts.windows.net/${config.tenantId}/`
        : `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
      audience: version === '1.0' ? [config.audience, `api://${config.audience}`] : config.audience,
    }));
    if (payload.ver !== version) throw new AuthError(401, 'UNAUTHENTICATED');
  } catch (error) {
    if (error instanceof errors.JWKSTimeout) {
      throw error;
    }
    if (error instanceof errors.JOSEError) {
      throw new AuthError(401, 'UNAUTHENTICATED');
    }
    throw error;
  }

  const tenantId = payload.tid;
  const objectId = payload.oid;
  const displayName = typeof payload.name === 'string' && payload.name.trim()
    ? payload.name
    : 'DEX 직원';
  if (
    typeof tenantId !== 'string' ||
    tenantId.toLowerCase() !== config.tenantId.toLowerCase() ||
    typeof objectId !== 'string'
  ) {
    throw new AuthError(401, 'UNAUTHENTICATED');
  }

  const roles = payload.roles;
  if (!Array.isArray(roles) || !roles.includes(PLAYER_ROLE)) {
    throw new AuthError(403, 'FORBIDDEN');
  }

  return { tenantId, objectId, displayName };
}
