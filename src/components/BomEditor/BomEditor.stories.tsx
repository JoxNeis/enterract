import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { BomEditor } from './BomEditor'
import { shelfBom } from './BomEditor.fixtures'

const meta = {
  title: 'Components/BomEditor',
  component: BomEditor,
  args: { productName: 'Shelving unit SU-180', defaultValue: shelfBom, defaultBuildQty: 1, readOnly: false, onChange: fn() },
  argTypes: { defaultValue: { control: false }, value: { control: false } },
} satisfies Meta<typeof BomEditor>

export default meta
type Story = StoryObj<typeof meta>

/** Double-click a quantity to edit it; the extended quantities follow. */
export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Add component under SHELF-90' }))
    await expect(args.onChange).toHaveBeenCalled()
  },
}

export const Empty: Story = { args: { defaultValue: [] } }

export const ReadOnly: Story = { args: { readOnly: true, defaultBuildQty: 25 } }

export const Disabled: Story = { args: { readOnly: true } }
