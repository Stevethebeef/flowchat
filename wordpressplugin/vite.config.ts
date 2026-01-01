import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    outDir: 'build/frontend',
    emptyOutDir: true,

    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'N8nChat',
      formats: ['iife'],
      fileName: () => 'chat.js',
    },

    rollupOptions: {
      // External dependencies (provided by WordPress)
      external: ['react', 'react-dom'],

      output: {
        // Global variables for external deps
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },

        // Asset file names
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'chat.css';
          }
          return assetInfo.name || 'asset';
        },
      },
    },

    // Minification settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },

    // Source maps for debugging
    sourcemap: process.env.NODE_ENV !== 'production',
  },

  // Dev server settings
  server: {
    port: 3000,
    strictPort: true,
    cors: true,
  },

  // Resolve aliases
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // Define environment variables - provide full process.env polyfill for browser
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'production',
    }),
  },
});
