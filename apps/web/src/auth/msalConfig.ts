import { PublicClientApplication, type Configuration } from '@azure/msal-browser';

const tenantId = import.meta.env.VITE_ENTRA_TENANT_ID?.trim() ?? '';
const clientId = import.meta.env.VITE_ENTRA_WEB_CLIENT_ID?.trim() ?? '';
const apiScope = import.meta.env.VITE_ENTRA_API_SCOPE?.trim() ?? '';

export const isAuthConfigured = Boolean(tenantId && clientId && apiScope);
export const isLocalPlaytest = import.meta.env.DEV && import.meta.env.VITE_LOCAL_PLAYTEST === 'true';

const msalConfiguration: Configuration = {
  auth: {
    // Placeholder values keep the public shell buildable until DEX app IDs are supplied.
    clientId: clientId || '00000000-0000-0000-0000-000000000000',
    authority: tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : 'https://login.microsoftonline.com/organizations',
    redirectUri: window.location.origin,
    postLogoutRedirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
  },
};

export const msalInstance = new PublicClientApplication(msalConfiguration);

export const loginRequest = {
  scopes: apiScope ? [apiScope] : [],
};
