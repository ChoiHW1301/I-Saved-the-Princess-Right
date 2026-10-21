import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App.js';
import { AuthProvider } from './auth/AuthProvider.js';
import { isAuthConfigured } from './auth/msalConfig.js';
import { RequireAuth } from './auth/RequireAuth.js';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    {isAuthConfigured ? (
      <AuthProvider>
        <RequireAuth>
          <App />
        </RequireAuth>
      </AuthProvider>
    ) : (
      <main>
        <h1>Entra ID 설정이 필요합니다</h1>
        <p>apps/web/.env.local에 .env.example의 사내 Entra 앱 값을 설정해 주세요.</p>
      </main>
    )}
  </StrictMode>,
);
