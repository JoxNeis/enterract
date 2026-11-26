import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Checkbox } from '../Checkbox'
import { FileUpload } from '../FileUpload'
import { Select } from '../Select'
import { Wizard, type WizardProps } from './Wizard'

function ImportWizard(args: Omit<WizardProps, 'steps'>) {
  const [file, setFile] = useState<File | null>(null)
  const [delimiter, setDelimiter] = useState<string | null>(',')
  const [confirmed, setConfirmed] = useState(false)
  return (
    <Wizard
      {...args}
      steps={[
        {
          key: 'file',
          title: 'Upload file',
          description: 'CSV or Excel file with one item per row.',
          content: (
            <FileUpload
              label='Price list'
              accept='.csv,.xlsx'
              multiple={false}
              onFilesSelected={(files) => {
                setFile(files[0] ?? null)
              }}
            />
          ),
          validate: () => (file ? true : 'Choose a file to import'),
        },
        {
          key: 'options',
          title: 'Options',
          optional: true,
          content: (
            <Select
              label='Delimiter'
              value={delimiter}
              onChange={setDelimiter}
              options={[
                { key: ',', label: 'Comma' },
                { key: ';', label: 'Semicolon' },
                { key: '\t', label: 'Tab' },
              ]}
            />
          ),
        },
        {
          key: 'review',
          title: 'Review',
          content: (
            <Checkbox
              label={`Import ${file?.name ?? 'the file'} and replace current prices`}
              value={confirmed}
              onChange={(v) => {
                setConfirmed(Boolean(v))
              }}
            />
          ),
          validate: () => confirmed || 'Confirm the import',
        },
      ]}
    />
  )
}

const meta = {
  title: 'Components/Wizard',
  component: Wizard,
  args: { steps: [], onFinish: fn(), onCancel: fn(), onStepChange: fn(), finishLabel: 'Import', allowStepNavigation: true },
  argTypes: { steps: { control: false } },
  render: (args) => (
    <div style={{ maxWidth: 640 }}>
      <ImportWizard {...args} />
    </div>
  ),
} satisfies Meta<typeof Wizard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByRole('alert')).toHaveTextContent('Choose a file to import')
    await expect(args.onStepChange).not.toHaveBeenCalled()
  },
}

export const Disabled: Story = { args: { allowStepNavigation: false } }
