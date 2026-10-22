import { describe, expect, it } from 'vitest';
import { readAuthConfig } from '../../src/config/env.js';

const validConfig = {
  ENTRA_TENANT_ID: '11111111-1111-4111-8111-111111111111',
  ENTRA_API_AUDIENCE: '33333333-3333-4333-8333-333333333333',
  COSMOS_ENDPOINT: 'https://example.documents.azure.com:443/',
};

describe('Function configuration validation', () => {
  it('requires an Application Insights connection string and HTTPS Cosmos endpoint in production', () => {
    expect(() => readAuthConfig({ ...validConfig, NODE_ENV: 'production' } as NodeJS.ProcessEnv)).toThrow('APPLICATIONINSIGHTS_CONNECTION_STRING');
    expect(() => readAuthConfig({ ...validConfig, NODE_ENV: 'production', APPLICATIONINSIGHTS_CONNECTION_STRING: 'InstrumentationKey=abc' } as NodeJS.ProcessEnv)).not.toThrow();
    expect(() => readAuthConfig({ ...validConfig, COSMOS_ENDPOINT: 'http://localhost:8081/', NODE_ENV: 'production', APPLICATIONINSIGHTS_CONNECTION_STRING: 'InstrumentationKey=abc' } as NodeJS.ProcessEnv)).toThrow('HTTPS in production');
  });

  it('keeps local emulator endpoints usable while reporting the setting name for missing values', () => {
    expect(readAuthConfig({ ...validConfig, COSMOS_ENDPOINT: 'http://localhost:8081/' } as NodeJS.ProcessEnv).cosmosEndpoint).toBe('http://localhost:8081/');
    expect(() => readAuthConfig({} as NodeJS.ProcessEnv)).toThrow('ENTRA_TENANT_ID');
  });
});
