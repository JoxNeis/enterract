import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'
import { Button } from '../Button'
import { Checkbox } from '../Checkbox'
import { CurrencyField } from '../CurrencyField'
import { DatePicker } from '../DatePicker'
import { RadioGroup } from '../RadioGroup'
import { Select } from '../Select'
import { uomOptions } from '../Select/Select.fixtures'
import { TextArea } from '../TextArea'
import { TextField } from '../TextField'
import { Form, type FormProps } from './Form'
import { useForm, type FormValues } from './useForm'

interface Order extends FormValues {
  customer: string | null
  orderDate: string | null
  deliveryDate: string | null
  uom: string | null
  amount: string | null
  terms: string | null
  rush: boolean | null
  notes: string | null
}

const initialValues: Order = {
  customer: 'Acme Trading',
  orderDate: '2026-03-15',
  deliveryDate: null,
  uom: 'PCS',
  amount: null,
  terms: 'net30',
  rush: false,
  notes: null,
}

interface DemoProps extends Omit<FormProps<Order>, 'form'> {
  onSave: (values: Order) => void
}

function OrderForm({ onSave, ...args }: DemoProps) {
  const form = useForm<Order>({
    initialValues,
    required: ['customer', 'deliveryDate', 'amount'],
    validate: (v) =>
      v.deliveryDate && v.orderDate && v.deliveryDate < v.orderDate
        ? { deliveryDate: 'Must be on or after the order date' }
        : {},
    onSubmit: async (values, { reset }) => {
      await new Promise((r) => setTimeout(r, 400))
      onSave(values)
      reset(values)
    },
  })
  return (
    <Form
      {...args}
      form={form}
      columns={2}
      labels={{ customer: 'Customer', deliveryDate: 'Delivery date', amount: 'Amount' }}
      style={{ maxWidth: 640 }}
    >
      <TextField
        label='Customer'
        {...form.field('customer')}
      />
      <CurrencyField
        label='Amount'
        currency='USD'
        {...form.field('amount')}
      />
      <DatePicker
        label='Order date'
        today='2026-03-15'
        {...form.field('orderDate')}
      />
      <DatePicker
        label='Delivery date'
        today='2026-03-15'
        {...form.field('deliveryDate')}
      />
      <Select
        label='Unit'
        options={uomOptions}
        {...form.field('uom')}
      />
      <RadioGroup
        label='Payment terms'
        orientation='horizontal'
        options={[
          { key: 'net30', label: 'Net 30' },
          { key: 'net60', label: 'Net 60' },
        ]}
        {...form.field('terms')}
      />
      <Checkbox
        label='Rush delivery'
        {...form.field('rush')}
      />
      <div style={{ gridColumn: '1 / -1' }}>
        <TextArea
          label='Notes'
          {...form.field('notes')}
        />
      </div>
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button
          type='submit'
          variant='primary'
          loading={form.isSubmitting}
        >
          Save
        </Button>
        <Button
          variant='ghost'
          disabled={!form.isDirty}
          onClick={() => {
            form.reset()
          }}
        >
          Discard changes
        </Button>
        <span style={{ fontSize: 12, color: 'var(--erp-color-text-muted)' }}>
          {form.isDirty ? `Changed: ${form.dirtyFields.join(', ')}` : 'No changes'}
        </span>
      </div>
    </Form>
  )
}

const meta = {
  title: 'Components/Form',
  component: Form,
  args: {
    readOnly: false,
    disabled: false,
    size: 'md',
    errorSummary: true,
    form: undefined as never,
  },
  argTypes: {
    form: { control: false },
    size: { control: 'inline-radio', options: ['sm', 'md'] },
    labels: { control: false },
  },
  render: (args) => (
    <OrderForm
      {...(args as Omit<FormProps<Order>, 'form'>)}
      onSave={fn()}
    />
  ),
} satisfies Meta<typeof Form>

export default meta
type Story = StoryObj<typeof meta>

/** Submit empty: the error summary lists each problem and its link focuses the field. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    const summary = await canvas.findByRole('alert')
    await expect(summary).toHaveTextContent('Delivery date')
    await userEvent.click(within(summary).getByRole('link', { name: /amount/i }))
    await expect(canvas.getByRole('textbox', { name: /amount/i })).toHaveFocus()
  },
}

export const ReadOnly: Story = { args: { readOnly: true } }

export const Disabled: Story = { args: { disabled: true } }

export const Compact: Story = { args: { size: 'sm' } }
