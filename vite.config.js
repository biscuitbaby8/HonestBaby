import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
      },
      includeAssets: ['favicon.svg', 'favicon.png', 'favicon-32.png', 'logo.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'HonestBaby',
        short_name: 'HonestBaby',
        description: '子育てグッズの忖度なし比較・レビューPWA',
        theme_color: '#FF6B6B',
        background_color: '#FFF5E4',
        display: 'standalone',
        icons: [
          {
            src: '/favicon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})
