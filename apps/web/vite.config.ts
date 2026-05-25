import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig({
  plugins: [react(), basicSsl()],
  define: {
    'import.meta.env.VITE_COMMIT_SHA': JSON.stringify(
      (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)
    ),
  },
});
