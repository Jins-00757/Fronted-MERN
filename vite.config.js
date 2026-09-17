import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    rollupOptions: {
      output: {
        // Splits large third-party libraries into their own chunks, separate
        // from app code - app code changes on nearly every deploy, but these
        // dependencies rarely do, so a returning visitor's browser can keep
        // serving them from cache instead of re-downloading everything.
        // leaflet/react-leaflet in particular is only used by the /map route
        // (see App.jsx's React.lazy() routes) - giving it its own chunk means
        // it's fetched once, on first visit to that page, and cached from
        // then on rather than bundled into every route's download.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-leaflet') || id.includes('/leaflet/')) return 'vendor-leaflet';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('socket.io-client') || id.includes('engine.io-client')) return 'vendor-realtime';
          if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('react-router')) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
})
