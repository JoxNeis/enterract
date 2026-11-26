import type { Meta, StoryObj } from '@storybook/react-vite'
import { Icon } from './Icon'
import { icons, type IconName } from './icons'

const meta = {
  title: 'Components/Icon',
  component: Icon,
  args: { name: 'search', size: 24 },
  argTypes: {
    name: { control: 'select', options: Object.keys(icons) },
    size: { control: 'number' },
  },
} satisfies Meta<typeof Icon>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Labelled: Story = {
  args: { name: 'warning', label: 'Warning' },
}

export const AllIcons: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 12 }}>
      {(Object.keys(icons) as IconName[]).map((name) => (
        <div
          key={name}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          <Icon
            {...args}
            name={name}
          />
          {name}
        </div>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: { style: { opacity: 0.4 } },
}
