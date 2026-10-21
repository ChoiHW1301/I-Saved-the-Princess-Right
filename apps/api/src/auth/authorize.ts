import { HttpRequest } from '@azure/functions';
import { createRemoteJWKSet, errors, jwtVerify } from 'jose';
import { readAuthConfig } from '../config/env.js';
import { AuthError } from './errors.js';

export interface Caller {
  tenantId: string;
  objectId: string;
  displayName: string;
}

const PLAYER_ROLE = 'CaravanGame.Player';
const jwksByTenant = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJwks(tenantId: string): ReturnType<typeof createRemoteJWKSet> {
  let jwks = jwksByTenant.get(tenantId);
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
    );
    jwksByTenant.set(tenantId, jwks);
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
    ({ payload } = await jwtVerify(match[1], getJwks(config.tenantId), {
      algorithms: ['RS256'],
      issuer: `https://login.microsoftonline.com/${config.tenantId}/v2.0`,
      audience: config.audience,
    }));
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
  const displayName = payload.name;
  if (
    typeof tenantId !== 'string' ||
    tenantId.toLowerCase() !== config.tenantId.toLowerCase() ||
    typeof objectId !== 'string' ||
    typeof displayName !== 'string'
  ) {
    throw new AuthError(401, 'UNAUTHENTICATED');
  }

  const roles = payload.roles;
  if (!Array.isArray(roles) || !roles.includes(PLAYER_ROLE)) {
    throw new AuthError(403, 'FORBIDDEN');
  }

  return { tenantId, objectId, displayName };
}
