import type { StorybookConfig } from '@storybook/react-vite'

// Windows: editors (VS Code) often start the process with a lowercase drive letter (`c:\…`), while
// Storybook resolves story files with an uppercase one (`C:\…`). builder-vite keys its story importers
// with a case-sensitive `relative(process.cwd(), file)`, so the mismatch produces keys like
// `./C:/Projects/…` that never match the index and every story renders blank
// ("importers[path] is not a function"). Normalise the drive letter before anything else runs.
if (process.platform === 'win32') {
  const cwd = process.cwd()
  const normalized = cwd.replace(/^[a-z]:/, (drive) => drive.toUpperCase())
  if (normalized !== cwd) process.chdir(normalized)
}

/** Plugins that only make sense for the library build (type declarations, per-chunk CSS imports). */
const LIBRARY_ONLY_PLUGINS = /dts|lib-inject-css/

const pluginName = (plugin: unknown) =>
  typeof plugin === 'object' && plugin !== null && 'name' in plugin ? String(plugin.name) : ''

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
  // Storybook reuses vite.config.ts; drop the library-mode settings so the static site has no
  // .d.ts files and Storybook controls its own entry points and chunking.
  viteFinal: (viteConfig) => {
    viteConfig.plugins = (viteConfig.plugins ?? []).flat().filter((plugin) => !LIBRARY_ONLY_PLUGINS.test(pluginName(plugin)))
    if (viteConfig.build) {
      viteConfig.build.lib = false
      viteConfig.build.rolldownOptions = undefined
    }
    return viteConfig
  },
}

export default config
