import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, screen, userEvent } from 'storybook/test'
import { Button } from '../Button'
import { Tooltip } from './Tooltip'

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  parameters: { layout: 'centered' },
  args: {
    content: 'Posts the invoice to the general ledger',
    placement: 'top',
    delay: 400,
    disabled: false,
    children: <Button variant='primary'>Post</Button>,
  },
  argTypes: {
    children: { control: false },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'top-start', 'bottom-start', 'right-start', 'left-start'],
    },
  },
} satisfies Meta<typeof Tooltip>

export default meta
type Story = StoryObj<typeof meta>

/** Tab to the button: the tooltip shows on keyboard focus, not only on hover. */
export const Default: Story = {
  play: async () => {
    await userEvent.tab()
    await expect(await screen.findByRole('tooltip')).toHaveTextContent('Posts the invoice')
    await userEvent.keyboard('{Escape}')
    await expect(screen.queryByRole('tooltip')).toBeNull()
  },
}

export const Bottom: Story = { args: { placement: 'bottom' } }

export const Disabled: Story = { args: { disabled: true } }
