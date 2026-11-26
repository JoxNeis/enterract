import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { ValueDisplay } from '../ValueDisplay'
import { Panel } from './Panel'

const meta = {
  title: 'Components/Panel',
  component: Panel,
  args: {
    title: 'Order summary',
    collapsible: false,
    variant: 'outlined',
    flush: false,
    onExpandedChange: fn(),
    children: (
      <div style={{ display: 'grid', gap: 8 }}>
        <ValueDisplay
          label='Subtotal'
          type='currency'
          value='1240'
          layout='horizontal'
        />
        <ValueDisplay
          label='Tax'
          type='currency'
          value='136.40'
          layout='horizontal'
        />
      </div>
    ),
  },
  argTypes: {
    children: { control: false },
    actions: { control: false },
    footer: { control: false },
    variant: { control: 'inline-radio', options: ['outlined', 'filled'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 420 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Panel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const WithActionsAndFooter: Story = {
  args: { actions: <Button size='sm'>Recalculate</Button>, footer: <strong>Total $1,376.40</strong> },
}

export const Collapsible: Story = {
  args: { collapsible: true },
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Order summary' }))
    await expect(args.onExpandedChange).toHaveBeenCalledWith(false, undefined)
  },
}

export const Filled: Story = { args: { variant: 'filled' } }

export const Disabled: Story = { args: { collapsible: true, defaultExpanded: false } }
