import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
    server: {
    port: 3000, 
  }, define: {
    'process.env': {REACT_APP_TINYMCE_API_KEY:'kkqv3mo4y5u5i20wrpjj8xmy5kpchz9dok5rbhpyuyqtog1c' },
    'process.platform': JSON.stringify(''),
    'process.version': JSON.stringify('')
  },
  resolve: {
    alias: {
      process: "process/browser"
    }
  }
})
