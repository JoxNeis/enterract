import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, screen, userEvent, within } from 'storybook/test'
import { accountTree, loadAccounts } from '../TreeView/TreeView.fixtures'
import type { ComponentType } from 'react'
import { TreeSelect, type SingleTreeSelectProps } from './TreeSelect'

/** TreeSelect props are a union by `multiple`; the Controls panel uses the single-select shape. */
const TreeSelectStory = TreeSelect as ComponentType<SingleTreeSelectProps<unknown>>

const meta = {
  title: 'Components/TreeSelect',
  component: TreeSelectStory,
  args: {
    label: 'GL account',
    nodes: accountTree,
    loadChildren: loadAccounts,
    defaultExpanded: ['1'],
    searchable: true,
    selectableParents: true,
    onChange: fn(),
    disabled: false,
    readOnly: false,
    required: false,
    size: 'md',
  },
  argTypes: {
    nodes: { control: false },
    loadChildren: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TreeSelectStory>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: /gl account/i }))
    await userEvent.click(screen.getByRole('treeitem', { name: /^Fixed assets/ }))
    await expect(args.onChange).toHaveBeenCalledWith('12', undefined)
  },
}

export const LeavesOnly: Story = { args: { selectableParents: false, helpText: 'Only posting accounts can be chosen' } }

export const Multiple: Story = {
  render: (args) => (
    <TreeSelect
      {...args}
      multiple
      label='Accounts'
      value={undefined}
      defaultValue={['111', '112']}
      onChange={undefined}
    />
  ),
}

export const Disabled: Story = { args: { disabled: true, defaultValue: '111' } }

export const ReadOnly: Story = { args: { readOnly: true, defaultValue: '111' } }

export const Required: Story = { args: { required: true } }

export const WithError: Story = { args: { error: 'Choose a posting account', defaultValue: '1' } }

export const Compact: Story = { args: { size: 'sm' } }
