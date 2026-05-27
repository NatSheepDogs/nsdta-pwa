import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['NSDTA-logo.png', 'RDN Logo.png', 'How the National Works.png', 'questions.json'],
      manifest: {
        name: 'National Sheep Dog Trials',
        short_name: 'NSDT',
        description: 'Live scores, video and radio for the National Sheep Dog Trials',
        theme_color: '#2c5f2e',
        background_color: '#2c5f2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'NSDTA-logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'NSDTA-logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'NSDTA-logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/docs\.google\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'google-sheets-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 300 }
            }
          }
        ]
      }
    })
  ],
})
