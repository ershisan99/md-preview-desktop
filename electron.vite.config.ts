import { resolve } from 'path'

import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        // external: ['builtin-modules'],
        // output: {
        //   manualChunks(id) {
        //     if (id.includes('builtin-modules')) {
        //       return 'builtin-modules'
        //     }
        //     if (id.includes('@it-incubator/md-bundler')) {
        //       return '@it-incubator/md-bundler'
        //     }
        //     if (id.includes('esbuild')) {
        //       return 'esbuild'
        //     }
        //   }
        // }
      },
    },
    // plugins: [externalizeDepsPlugin({ exclude: ['@it-incubator/md-bundler', 'builtin-modules'] })],
    plugins: [externalizeDepsPlugin({ exclude: ['rehype-slug'] })],
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    plugins: [react()],
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
  },
})
