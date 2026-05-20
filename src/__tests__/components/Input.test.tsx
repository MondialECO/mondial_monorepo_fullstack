import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('should render input element', () => {
    render(<Input />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
  });

  it('should have correct default type', () => {
    render(<Input />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('text');
  });

  it('should support different input types', () => {
    const { container } = render(
      <>
        <Input type="email" />
        <Input type="password" />
        <Input type="number" />
      </>
    );

    const inputs = container.querySelectorAll('input');
    expect(inputs[0].type).toBe('email');
    expect(inputs[1].type).toBe('password');
    expect(inputs[2].type).toBe('number');
  });

  it('should handle value changes', async () => {
    const user = userEvent.setup();
    render(<Input placeholder="Enter text" />);
    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement;

    await user.type(input, 'Hello World');

    expect(input.value).toBe('Hello World');
  });

  it('should support placeholder attribute', () => {
    render(<Input placeholder="Enter your email" />);
    const input = screen.getByPlaceholderText('Enter your email');

    expect(input).toBeDefined();
  });

  it('should be disabled when disabled prop is set', () => {
    render(<Input disabled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    expect(input.disabled).toBe(true);
  });

  it('should support readonly attribute', () => {
    render(<Input readOnly value="Read only" />);
    const input = screen.getByDisplayValue('Read only') as HTMLInputElement;

    expect(input.readOnly).toBe(true);
  });

  it('should support className prop', () => {
    const { container } = render(<Input className="custom-input" />);
    const input = container.querySelector('input');

    expect(input?.className).toContain('custom-input');
  });

  it('should trigger onChange event', async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(<Input onChange={handleChange} />);
    const input = screen.getByRole('textbox');

    await user.type(input, 'test');

    expect(handleChange).toHaveBeenCalled();
  });

  it('should support onBlur event', async () => {
    const handleBlur = vi.fn();
    const user = userEvent.setup();

    render(<Input onBlur={handleBlur} />);
    const input = screen.getByRole('textbox');

    await user.click(input);
    await user.tab();

    expect(handleBlur).toHaveBeenCalled();
  });

  it('should support onFocus event', async () => {
    const handleFocus = vi.fn();
    const user = userEvent.setup();

    render(<Input onFocus={handleFocus} />);
    const input = screen.getByRole('textbox');

    await user.click(input);

    expect(handleFocus).toHaveBeenCalled();
  });

  it('should have default value when provided', () => {
    render(<Input defaultValue="Initial value" />);
    const input = screen.getByDisplayValue('Initial value') as HTMLInputElement;

    expect(input.value).toBe('Initial value');
  });

  it('should support required attribute', () => {
    render(<Input required />);
    const input = screen.getByRole('textbox') as HTMLInputElement;

    expect(input.required).toBe(true);
  });

  it('should support min and max attributes for number input', () => {
    const { container } = render(
      <Input type="number" min="0" max="100" />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.min).toBe('0');
    expect(input.max).toBe('100');
  });

  it('should support pattern attribute for validation', () => {
    const { container } = render(
      <Input type="text" pattern="[A-Z]+" />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.pattern).toBe('[A-Z]+');
  });

  it('should accept form integration attributes', () => {
    const { container } = render(
      <Input name="email" id="email-input" />
    );

    const input = container.querySelector('input') as HTMLInputElement;
    expect(input.name).toBe('email');
    expect(input.id).toBe('email-input');
  });
});
