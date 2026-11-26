// Windows: if the terminal's cwd is spelled `c:\...` instead of the real `C:\...`, Node loads
// Vitest under one path and Vite loads it under the other, so two Vitest instances run and
// every test file fails with "Vitest failed to find the current suite". Starting Vitest from
// the real path avoids that. On macOS/Linux this is a no-op.
import { realpathSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { pathToFileURL } from 'node:url'

process.chdir(realpathSync.native(process.cwd()))

const require = createRequire(import.meta.url)
const vitestDir = dirname(realpathSync.native(require.resolve('vitest/package.json')))

await import(pathToFileURL(join(vitestDir, 'vitest.mjs')).href)
