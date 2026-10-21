import { useCallback } from 'react';
import { InteractionRequiredAuthError, InteractionStatus } from '@azure/msal-browser';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig.js';

export function useApiToken(): { getToken(): Promise<string> } {
  const { instance, accounts, inProgress } = useMsal();
  const accountHomeId = accounts[0]?.homeAccountId;

  const getToken = useCallback(async () => {
    const account = accountHomeId
      ? instance.getAllAccounts().find((candidate) => candidate.homeAccountId === accountHomeId)
      : undefined;
    if (!account) {
      throw new Error('Sign in before requesting an API token.');
    }
    if (inProgress !== InteractionStatus.None) {
      throw new Error('Wait for the current sign-in action to finish.');
    }

    const request = { ...loginRequest, account };
    try {
      const response = await instance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      if (error instanceof InteractionRequiredAuthError) {
        await instance.acquireTokenRedirect(request);
        throw new Error('Redirecting to Entra ID to continue authentication.');
      }
      throw new Error('Could not acquire an API token. Please retry.');
    }
  }, [accountHomeId, inProgress, instance]);

  return { getToken };
}
