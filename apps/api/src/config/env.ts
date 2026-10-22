export interface AuthConfig {
  tenantId: string;
  audience: string;
  cosmosEndpoint: string;
}

const TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function readAuthConfig(env: NodeJS.ProcessEnv = process.env): AuthConfig {
  const tenantId = env.ENTRA_TENANT_ID?.trim();
  const audience = env.ENTRA_API_AUDIENCE?.trim();
  const cosmosEndpoint = env.COSMOS_ENDPOINT?.trim();

  if (!tenantId || !TENANT_ID_PATTERN.test(tenantId)) {
    throw new Error('ENTRA_TENANT_ID must be a valid Entra tenant GUID.');
  }
  if (!audience) {
    throw new Error('ENTRA_API_AUDIENCE must be the API application client ID.');
  }
  if (!cosmosEndpoint) {
    throw new Error('COSMOS_ENDPOINT is required.');
  }
  if (env.NODE_ENV === 'production' && !env.APPLICATIONINSIGHTS_CONNECTION_STRING?.trim()) {
    throw new Error('APPLICATIONINSIGHTS_CONNECTION_STRING is required in production.');
  }

  let endpoint: URL;
  try {
    endpoint = new URL(cosmosEndpoint);
  } catch {
    throw new Error('COSMOS_ENDPOINT must be a valid URL.');
  }
  if (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && env.NODE_ENV !== 'production')) {
    throw new Error('COSMOS_ENDPOINT must use HTTPS in production (HTTP is allowed for local development).');
  }

  return { tenantId, audience, cosmosEndpoint: endpoint.toString() };
}
