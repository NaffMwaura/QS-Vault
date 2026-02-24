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
})
