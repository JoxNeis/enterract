/// <reference types="vite/client" />
/// <reference types="vitest/config" />
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { globSync } from 'glob'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      tsconfigPath: 'tsconfig.app.json',
      exclude: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}', '**/*.fixtures.ts', 'src/test/**', '.storybook/**'],
    }),
  ],
  build: {
    lib: {
      entry: 'src/main.ts',
      formats: ['es'],
    },
    rolldownOptions: {
      external: [/^react($|\/)/, /^react-dom($|\/)/],
      input: Object.fromEntries(
        globSync(['src/components/**/index.{ts,tsx}', 'src/main.ts']).map((file) => {
          const entryName = path.relative(
            'src',
            file.slice(0, file.length - path.extname(file).length)
          )
          const entryUrl = fileURLToPath(new URL(file, import.meta.url))
          return [entryName, entryUrl]
        })
      ),
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/components/**/*.{ts,tsx}'],
      exclude: ['**/*.stories.{ts,tsx}', '**/*.test.{ts,tsx}', '**/*.fixtures.ts', '**/index.ts'],
    },
  },
})
