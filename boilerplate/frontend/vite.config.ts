import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@midnight-ntwrk/contract': path.resolve(__dirname, '../contract/src/index.ts'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: [
        '@midnight-ntwrk/compact-runtime',
        '@midnight-ntwrk/onchain-runtime',
      ],
    },
  },
  optimizeDeps: {
    exclude: [
      '@midnight-ntwrk/compact-runtime',
      '@midnight-ntwrk/onchain-runtime',
    ],
  },
})
