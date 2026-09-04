import { defineConfig } from 'vite'
import path from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true'
      ? visualizer({
          filename: 'dist/bundle-report.html',
          template: 'treemap',
          gzipSize: true,
          brotliSize: true,
          open: true,
        })
      : null,
  ].filter(Boolean),
  // Strip debug logging from PRODUCTION builds only (dev keeps them).
  // console.error / console.warn are kept on purpose — they're legitimate
  // diagnostics you'd want if something goes wrong in prod.
  esbuild: {
    pure: ['console.log', 'console.info', 'console.debug', 'console.trace'],
    drop: ['debugger'],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Dev-only proxy so the NEET predictor API is same-origin and avoids CORS.
      // In production the NEET API must send CORS headers (see Access-Control-Allow-Origin).
      '/neet-api': {
        target: 'https://neet-rank-predictor-two.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/neet-api/, ''),
      },
      // Dev-only proxy so the MHT CET predictor API is same-origin, exactly as
      // /neet-api above. In production the API must send CORS headers.
      '/mhtcet-api': {
        // Same host as /neet-api, on request. See the note in src/api/mhtcet.ts:
        // this host does not currently serve the MHT CET /predict* routes.
        target: 'https://neet-rank-predictor-two.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/mhtcet-api/, ''),
      },
      // The v1 counselling API behind the new /neet-predictor page.
      // Target comes from VITE_NEET_COUNSELLING_API_URL so dev and prod agree.
      '/neet-v1': {
        target:
          process.env.VITE_NEET_COUNSELLING_API_URL ||
          'https://procounsellor-procounsel-neet-api.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/neet-v1/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 'react-dom/client' is listed separately on purpose. It is a
          // DIFFERENT module id from 'react-dom', and it is the one the app
          // actually imports — so naming only 'react-dom' put the 7 KB legacy
          // shim in this chunk and left the 540 KB client renderer in the entry
          // chunk, where it was re-downloaded on every deploy that touched app
          // code. Same bytes on a first visit; cached across deploys after.
          'react-vendor': ['react', 'react-dom', 'react-dom/client', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['lucide-react', 'react-icons'],
          // NOTE: recharts and MUI intentionally NOT grouped into named chunks.
          // Forcing them into named vendor chunks co-located a small shared dep with
          // eager code, dragging the whole ~356KB (recharts) / ~160KB (MUI) chunk into
          // the initial home bundle. Letting Rollup auto-split keeps them only in the
          // lazy dashboard/profile/calendar routes that actually use them.
          'firebase-vendor': ['firebase'],
        },
      },
    },
    // Enable CSS code-splitting per chunk
    cssCodeSplit: true,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 600,
  }
})


