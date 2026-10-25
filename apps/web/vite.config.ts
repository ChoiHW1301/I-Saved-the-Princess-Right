import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { localPlaytestApi } from './vite.localPlaytest.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const localPlaytest = mode === 'development' && env.VITE_LOCAL_PLAYTEST === 'true';
  return {
    plugins: [react(), ...(localPlaytest ? [localPlaytestApi()] : [])],
    server: {
      proxy: localPlaytest ? undefined : {
        '/api': {
          target: 'http://127.0.0.1:7071',
          changeOrigin: true,
        },
      },
    },
  };
});
