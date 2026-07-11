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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'motion-vendor': ['framer-motion'],
          'ui-vendor': ['lucide-react', 'react-icons'],
          'chart-vendor': ['recharts'],
          'mui-vendor': ['@mui/material', '@mui/x-date-pickers', '@emotion/react', '@emotion/styled'],
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


