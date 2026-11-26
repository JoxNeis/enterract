import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { Link } from './Link'

const meta = {
  title: 'Components/Link',
  component: Link,
  args: { children: 'SO-2026-1043', href: '#order', external: false, disabled: false, variant: 'default' },
  argTypes: { variant: { control: 'inline-radio', options: ['default', 'subtle'] } },
} satisfies Meta<typeof Link>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('link', { name: 'SO-2026-1043' })).toHaveAttribute('href', '#order')
  },
}

export const External: Story = { args: { children: 'Tax office website', href: 'https://example.com', external: true } }

export const Subtle: Story = { args: { variant: 'subtle' } }

export const Disabled: Story = { args: { disabled: true } }
