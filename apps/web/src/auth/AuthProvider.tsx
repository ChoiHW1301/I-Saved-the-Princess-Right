import type { ReactNode } from 'react';
import { MsalProvider } from '@azure/msal-react';
import { msalInstance } from './msalConfig.js';

export function AuthProvider({ children }: { children: ReactNode }) {
  return <MsalProvider instance={msalInstance}>{children}</MsalProvider>;
}
