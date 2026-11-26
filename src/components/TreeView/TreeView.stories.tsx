import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Icon } from '../Icon'
import { TreeView } from './TreeView'
import { accountTree, loadAccounts } from './TreeView.fixtures'

const meta = {
  title: 'Components/TreeView',
  component: TreeView,
  args: {
    nodes: accountTree,
    'aria-label': 'Chart of accounts',
    defaultExpanded: ['1'],
    selectionMode: 'single',
    checkable: false,
    filterText: '',
    size: 'md',
    onSelectedChange: fn(),
    onExpandedChange: fn(),
    onActivate: fn(),
    loadChildren: loadAccounts,
  },
  argTypes: {
    nodes: { control: false },
    loadChildren: { control: false },
    renderLabel: { control: false },
    selectionMode: { control: 'inline-radio', options: ['none', 'single', 'multiple'] },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 360 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof TreeView>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('treeitem', { name: /^Current assets/ }))
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}')
    await expect(args.onSelectedChange).toHaveBeenLastCalledWith(['111'])
  },
}

export const Checkboxes: Story = { args: { selectionMode: 'multiple', checkable: true, defaultExpanded: ['1', '11', '12'] } }

/** Equity loads its children when expanded. */
export const LazyLoading: Story = { args: { defaultExpanded: [] } }

export const Search: Story = { args: { filterText: 'receiv' } }

export const WithIcons: Story = {
  args: {
    nodes: [
      {
        id: 'hq',
        label: 'Head office',
        icon: <Icon name='home' />,
        children: [
          { id: 'fin', label: 'Finance', icon: <Icon name='users' /> },
          { id: 'ops', label: 'Operations', icon: <Icon name='users' /> },
        ],
      },
    ],
    defaultExpanded: ['hq'],
    'aria-label': 'Organization',
  },
}

export const Compact: Story = { args: { size: 'sm', defaultExpanded: ['1', '11'] } }

export const Disabled: Story = { args: { selectionMode: 'none' } }
