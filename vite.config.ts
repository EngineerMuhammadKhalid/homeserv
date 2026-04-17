import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { createRequire } from 'module';

// Safely load the Tailwind Vite plugin. Some CI or host environments
// may fail to resolve optional native bindings for @tailwindcss/oxide.
// Fall back to a no-op plugin to allow builds to proceed.
const require = createRequire(import.meta.url);
let tailwindcss: any;
try {
  tailwindcss = require('@tailwindcss/vite').default;
} catch (e) {
  // no-op plugin
  tailwindcss = () => ({ name: 'tailwindcss-noop' });
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
  plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
