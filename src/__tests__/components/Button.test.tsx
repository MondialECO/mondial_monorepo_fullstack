import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeDefined();
  });

  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click</Button>);
    const button = screen.getByRole('button', { name: /click/i });

    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('should support different variants', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');

    expect(button?.className).toContain('outline');
  });

  it('should support different sizes', () => {
    const { container } = render(<Button size="sm">Small</Button>);
    const button = container.querySelector('button');

    expect(button?.className).toContain('sm');
  });

  it('should be disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
  });

  it('should not trigger click handler when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });

    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render as different HTML elements with asChild prop', () => {
    const { container } = render(
      <Button asChild>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/">Home</a>
      </Button>
    );

    const link = container.querySelector('a');
    expect(link?.href).toContain('/');
  });

  it('should support type prop', () => {
    const { container } = render(<Button type="submit">Submit</Button>);
    const button = container.querySelector('button');

    expect(button?.type).toBe('submit');
  });

  it('should render with className prop', () => {
    const { container } = render(<Button className="custom-class">Custom</Button>);
    const button = container.querySelector('button');

    expect(button?.className).toContain('custom-class');
  });

  it('should support loading state with children change', () => {
    const { rerender } = render(<Button>Save</Button>);
    expect(screen.getByText('Save')).toBeDefined();

    rerender(<Button disabled>Saving...</Button>);
    expect(screen.getByText('Saving...')).toBeDefined();
  });
});
