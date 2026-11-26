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

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: '@storybook/react-vite',
  core: {
    disableTelemetry: true,
  },
}

export default config
