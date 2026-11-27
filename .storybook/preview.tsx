import type { Preview } from '@storybook/react-vite'
import { LocaleProvider } from '../src/components/LocaleProvider'
import '../src/styles/base.css'

const preview: Preview = {
  parameters: {
    options: {
      storySort: { order: ['Introduction', 'Theming', 'Components'] },
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  globalTypes: {
    density: {
      description: 'Control density',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
        dynamicTitle: true,
      },
    },
    locale: {
      description: 'Locale for numbers and dates',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'en-US', title: 'en-US' },
          { value: 'de-DE', title: 'de-DE' },
          { value: 'id-ID', title: 'id-ID' },
          { value: 'fr-FR', title: 'fr-FR' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    density: 'comfortable',
    locale: 'en-US',
  },
  decorators: [
    (Story, context) => (
      <LocaleProvider locale={String(context.globals.locale ?? 'en-US')}>
        <div
          data-density={context.globals.density === 'compact' ? 'compact' : undefined}
          style={{ fontFamily: 'var(--erp-font-family)', color: 'var(--erp-color-text)' }}
        >
          <Story />
        </div>
      </LocaleProvider>
    ),
  ],
  tags: ['autodocs'],
}

export default preview
