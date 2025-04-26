import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
  }
});