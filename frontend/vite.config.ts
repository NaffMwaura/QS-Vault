import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),
    
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'QS Pocket Knife Vault',
        short_name: 'QSVault',
        description: 'Professional Quantity Surveying Offline Vault',
        theme_color: '#f59e0b',
        // ... include other manifest properties here if you want Vite to generate it
      }
    }),
    tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;

          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
            return 'react-vendor';
          }

          if (id.includes('@supabase') || id.includes('dexie')) {
            return 'data-vendor';
          }

          if (id.includes('@tanstack/react-query')) {
            return 'query-vendor';
          }

          if (id.includes('lucide-react')) {
            return 'icons-vendor';
          }
        },
      },
    },
  },
})
