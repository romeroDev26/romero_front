import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          'form-vendor': ['react-hook-form', 'formik', 'yup', 'zod'],
          'data-vendor': ['@tanstack/react-query', 'axios', 'zustand']
        }
      }
    }
  },
  server: {
    allowedHosts: [
      'rock-md-clips-chocolate.trycloudflare.com',
      'localhost',
      '*.vercel.app'
    ],
    proxy: {
      // Proxy para cargar imágenes del CDN de Bunny en desarrollo sin bloqueo CORS.
      // pdfLogo.ts llama: /__image-proxy?url=<encoded-cdn-url>
      '/__image-proxy': {
        target: 'https://romero-cdn-v2.b-cdn.net',
        changeOrigin: true,
        rewrite: (path) => {
          const match = path.match(/[?&]url=([^&]+)/);
          if (!match) return path;
          const decoded = decodeURIComponent(match[1]);
          // Quitar el origen del CDN y dejar solo el path
          return decoded.replace('https://romero-cdn-v2.b-cdn.net', '');
        },
      },
    },
  }
});