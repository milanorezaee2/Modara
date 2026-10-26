import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const supabaseStub = fileURLToPath(new URL('./src/lib/supabaseJsStub.ts', import.meta.url));
const localBackendStub = fileURLToPath(
  new URL('./src/lib/localBackendStub.ts', import.meta.url),
);

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const hasSupabaseCredentials = Boolean(
    (env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL) &&
      (env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY),
  );

  /**
   * The app has two mutually exclusive backend implementations. Keeping the
   * unused one out of the graph saves the Supabase SDK in demo builds and the
   * local seed/backend in credentialed production builds.
   */
  const backendBoundary = {
    name: 'modara-backend-boundary',
    enforce: 'pre' as const,
    resolveId(source: string, importer?: string) {
      if (!hasSupabaseCredentials && source === '@supabase/supabase-js') {
        return supabaseStub;
      }
      if (
        hasSupabaseCredentials &&
        source === './localBackend' &&
        importer?.includes('/src/lib/supabase.ts')
      ) {
        return localBackendStub;
      }
      return null;
    },
  };

  return {
    // The dev server always runs at "/", while the production build defaults to
    // "/Modara/" because GitHub Pages serves this repository under that sub path.
    // Build with BASE_PATH=/ when deploying to a custom domain or root host.
    base: command === 'build' ? process.env.BASE_PATH ?? '/Modara/' : '/',
    plugins: [backendBoundary, react()],
    optimizeDeps: {
      // Pre-bundling Lucide is essential in dev: otherwise the browser walks
      // its ESM barrel file and requests well over a thousand icon modules.
      include: ['lucide-react'],
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      modulePreload: { polyfill: false },
      reportCompressedSize: false,
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      // allow the sandbox/preview proxy hosts (e2b, ngrok-style tunnels, LAN)
      allowedHosts: true,
      hmr: { clientPort: 443 },
    },
    preview: {
      host: '0.0.0.0',
      port: 4173,
      strictPort: true,
      allowedHosts: true,
    },
  };
});
