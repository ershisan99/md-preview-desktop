import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    // plugins: [externalizeDepsPlugin({ exclude: ['@it-incubator/md-bundler', 'builtin-modules'] })],
    plugins: [externalizeDepsPlugin({ exclude: ['rehype-slug'] })],
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
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
