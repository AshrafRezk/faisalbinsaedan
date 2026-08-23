import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    // Bind all IPv4 interfaces so Netlify Dev can reach Vite whether it uses
    // 127.0.0.1 or localhost→IPv4 (see scripts/netlify-dev.sh dns-result-order).
    // host: 'localhost' often listens on ::1 only, which makes :8888 hang.
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'icons/*.png',
        'FBS logo acronim.svg',
        'FBS_Logo_Vertical_AR.png',
        'appicon.png',
      ],
      manifest: {
        name: 'فيصل بن سعيدان | Faisal Bin Saedan Properties',
        short_name: 'Bin Saedan',
        description: 'اكتشف أرقى المشاريع العقارية مع مجموعة فيصل بن سعيدان',
        theme_color: '#1a365d',
        background_color: '#fafafa',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/appicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/appicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        lang: 'ar',
        dir: 'rtl'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,pdf}'],
        // Do not SPA-fallback PDF/doc paths — otherwise iframe previews load index.html
        navigateFallbackDenylist: [/^\/docs\//, /\.pdf$/i, /^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.my\.salesforce\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'salesforce-api',
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      devOptions: {
        enabled: false
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'framer-motion': ['framer-motion'],
          'map-vendor': ['leaflet', 'react-leaflet'],
          'pdf-vendor': ['pdfjs-dist']
        }
      }
    }
  }
})
