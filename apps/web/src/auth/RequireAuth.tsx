import { useEffect, useState, type JSX, type ReactNode } from 'react';
import { InteractionStatus } from '@azure/msal-browser';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { loginRequest } from './msalConfig.js';
import { useApiToken } from './useApiToken.js';

type AccessState = 'idle' | 'checking' | 'allowed' | 'forbidden' | 'error';

export function RequireAuth({ children }: { children: ReactNode }): JSX.Element {
  const { instance, accounts, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const { getToken } = useApiToken();
  const [message, setMessage] = useState<string | null>(null);
  const [accessState, setAccessState] = useState<AccessState>('idle');
  const [retryNumber, setRetryNumber] = useState(0);
  const accountHomeId = accounts[0]?.homeAccountId;

  useEffect(() => {
    if (!isAuthenticated || inProgress !== InteractionStatus.None) {
      setAccessState('idle');
      return;
    }

    let cancelled = false;
    setAccessState('checking');
    setMessage(null);

    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled) return;
        if (response.status === 403) {
          setAccessState('forbidden');
          return;
        }
        if (!response.ok) {
          setAccessState('error');
          setMessage('계정 권한을 확인할 수 없습니다. 다시 시도해 주세요.');
          return;
        }
        setAccessState('allowed');
      } catch {
        if (!cancelled) {
          setAccessState('error');
          setMessage('로그인 또는 API 연결을 확인할 수 없습니다. 다시 시도해 주세요.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [accountHomeId, getToken, inProgress, isAuthenticated, retryNumber]);

  async function signIn() {
    setMessage(null);
    try {
      await instance.loginRedirect(loginRequest);
    } catch {
      setMessage('로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  async function signOut() {
    setMessage(null);
    try {
      await instance.logoutRedirect({ account: accounts[0] });
    } catch {
      setMessage('로그아웃을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  if (inProgress !== InteractionStatus.None) {
    return <main aria-live="polite">Entra 로그인 상태를 확인하고 있습니다...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main>
        <p>DEX 사내 계정으로 로그인해야 플레이할 수 있습니다.</p>
        {message && <p role="alert">{message}</p>}
        <button type="button" onClick={signIn}>
          사내 계정으로 로그인
        </button>
      </main>
    );
  }

  if (accessState === 'checking' || accessState === 'idle') {
    return <main aria-live="polite">DEX 계정 권한을 확인하고 있습니다...</main>;
  }

  if (accessState === 'forbidden') {
    return (
      <main>
        <p role="alert">이 계정에는 게임 이용 권한이 없습니다. DEX 게임 사용자 그룹을 확인해 주세요.</p>
        <button type="button" onClick={signOut}>로그아웃</button>
      </main>
    );
  }

  if (accessState === 'error') {
    return (
      <main>
        <p role="alert">{message}</p>
        <button type="button" onClick={() => setRetryNumber((value) => value + 1)}>
          다시 시도
        </button>
        <button type="button" onClick={signOut}>로그아웃</button>
      </main>
    );
  }

  return (
    <>
      <header>
        <span>{accounts[0]?.name ?? accounts[0]?.username ?? '로그인 사용자'}</span>
        <button type="button" onClick={signOut}>
          로그아웃
        </button>
      </header>
      {children}
    </>
  );
}
