import { render, screen, fireEvent } from '@testing-library/react'
import { FormPage, FormField, FormInput, FormSelect, FormTextArea } from '@/components/entrepreneur/FormTemplates'

describe('FormTemplates Components', () => {
  describe('FormField', () => {
    it('should render label with required indicator', () => {
      render(
        <FormField label="Email" isRequired>
          <input type="email" />
        </FormField>
      )

      expect(screen.getByText('EMAIL')).toBeInTheDocument()
      expect(screen.getByText('*')).toBeInTheDocument()
    })

    it('should display hint text', () => {
      render(
        <FormField label="Email" hint="Your work email">
          <input type="email" />
        </FormField>
      )

      expect(screen.getByText('Your work email')).toBeInTheDocument()
    })

    it('should display error message when provided', () => {
      render(
        <FormField label="Email" error="Invalid email format">
          <input type="email" />
        </FormField>
      )

      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  describe('FormInput', () => {
    it('should render input element with correct attributes', () => {
      const { container } = render(
        <FormInput
          type="text"
          value="test"
          onChange={jest.fn()}
          placeholder="Enter text"
          maxLength={50}
        />
      )

      const input = container.querySelector('input')
      expect(input).toHaveAttribute('type', 'text')
      expect(input).toHaveAttribute('maxlength', '50')
      expect(input).toHaveAttribute('placeholder', 'Enter text')
    })

    it('should call onChange when input changes', () => {
      const onChange = jest.fn()
      const { container } = render(
        <FormInput type="text" value="" onChange={onChange} />
      )

      const input = container.querySelector('input') as HTMLInputElement
      fireEvent.change(input, { target: { value: 'new value' } })

      expect(onChange).toHaveBeenCalledWith('new value')
    })
  })

  describe('FormSelect', () => {
    it('should render select with options', () => {
      render(
        <FormSelect
          value="saas"
          onChange={jest.fn()}
          options={[
            { value: 'saas', label: 'SaaS' },
            { value: 'fintech', label: 'FinTech' },
          ]}
          placeholder="Select industry"
        />
      )

      expect(screen.getByText('SaaS')).toBeInTheDocument()
      expect(screen.getByText('FinTech')).toBeInTheDocument()
    })

    it('should call onChange when selection changes', () => {
      const onChange = jest.fn()
      const { container } = render(
        <FormSelect
          value=""
          onChange={onChange}
          options={[
            { value: 'saas', label: 'SaaS' },
            { value: 'fintech', label: 'FinTech' },
          ]}
        />
      )

      const select = container.querySelector('select') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'saas' } })

      expect(onChange).toHaveBeenCalledWith('saas')
    })
  })

  describe('FormTextArea', () => {
    it('should render textarea with character counter', () => {
      render(
        <FormTextArea
          value="test"
          onChange={jest.fn()}
          maxLength={100}
        />
      )

      expect(screen.getByText('4/100 characters')).toBeInTheDocument()
    })

    it('should call onChange when textarea changes', () => {
      const onChange = jest.fn()
      const { container } = render(
        <FormTextArea value="" onChange={onChange} />
      )

      const textarea = container.querySelector('textarea') as HTMLTextAreaElement
      fireEvent.change(textarea, { target: { value: 'new text' } })

      expect(onChange).toHaveBeenCalledWith('new text')
    })
  })

  describe('FormPage', () => {
    it('should render progress bar with correct width', () => {
      const { container } = render(
        <FormPage
          phaseTitle="Phase 1"
          stepNumber={2}
          stepTotal={4}
          formTitle="Step 2"
          formDescription="Complete this step"
          isLoading={false}
          error={null}
          success={false}
          successMessage="Done!"
          onDismissError={jest.fn()}
          onBack={jest.fn()}
          onSubmit={jest.fn()}
          submitButtonLabel="Next"
        >
          <input type="text" />
        </FormPage>
      )

      const progressBar = container.querySelector('[style*="width"]')
      expect(progressBar).toHaveStyle('width: 50%') // 2/4 = 50%
    })

    it('should display loading state when isLoading is true', () => {
      render(
        <FormPage
          phaseTitle="Phase 1"
          stepNumber={1}
          stepTotal={1}
          formTitle="Test"
          formDescription="Test"
          isLoading={true}
          error={null}
          success={false}
          successMessage="Done!"
          onDismissError={jest.fn()}
          onBack={jest.fn()}
          onSubmit={jest.fn()}
        >
          <input />
        </FormPage>
      )

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })
})
