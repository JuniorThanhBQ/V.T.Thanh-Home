import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  envDir: '../',
  plugins: [
    tailwindcss(),
    react(),
    babel({
      include: [/[\\/]src[\\/](features|shared)[\\/].*\.tsx$/],
      exclude: [/node_modules/],
      presets: [reactCompilerPreset()],
    }),
  ],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react'
            }
            if (id.includes('framer-motion') || id.includes('lenis')) {
              return 'vendor-motion'
            }
            if (id.includes('react-markdown') || id.includes('remark-gfm') || id.includes('micromark') || id.includes('unist') || id.includes('mdast')) {
              return 'vendor-markdown'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('socket.io-client')) {
              return 'vendor-socket'
            }
          }
        },
      },
    },
  },
})
