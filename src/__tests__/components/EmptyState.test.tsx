import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import EmptyState from '@/components/shared/EmptyState';
import { Package } from 'lucide-react';

describe('EmptyState Component', () => {
  it('should render with title and message', () => {
    render(
      <EmptyState
        title="No items found"
        message="You haven't created any projects yet."
      />
    );

    expect(screen.getByText('No items found')).toBeDefined();
    expect(screen.getByText("You haven't created any projects yet.")).toBeDefined();
  });

  it('should render with emoji icon', () => {
    render(
      <EmptyState
        emoji="📦"
        title="Empty"
        message="Nothing here"
      />
    );

    expect(screen.getByText('📦')).toBeDefined();
  });

  it('should render with lucide icon', () => {
    const { container } = render(
      <EmptyState
        icon={Package}
        title="No packages"
        message="No packages available"
      />
    );

    const svgIcon = container.querySelector('svg');
    expect(svgIcon).toBeDefined();
  });

  it('should apply custom maxWidth class', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        message="Test message"
        maxWidth="max-w-md"
      />
    );

    const wrapper = container.querySelector('.max-w-md');
    expect(wrapper).toBeDefined();
  });

  it('should apply default maxWidth class when not provided', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        message="Test message"
      />
    );

    const wrapper = container.querySelector('.max-w-2xl');
    expect(wrapper).toBeDefined();
  });

  it('should render with both icon and title', () => {
    const { container } = render(
      <EmptyState
        icon={Package}
        title="Empty Package List"
        message="No packages found"
      />
    );

    expect(screen.getByText('Empty Package List')).toBeDefined();
    const svg = container.querySelector('svg');
    expect(svg).toBeDefined();
  });

  it('should not render icon when none is provided', () => {
    const { container } = render(
      <EmptyState
        title="No icon"
        message="No icon provided"
      />
    );

    const svg = container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('should have correct styling classes', () => {
    const { container } = render(
      <EmptyState
        title="Styled"
        message="With styling"
      />
    );

    const wrapper = container.querySelector('.text-center');
    expect(wrapper?.className).toContain('py-16');
    expect(wrapper?.className).toContain('bg-card');
    expect(wrapper?.className).toContain('rounded-lg');
    expect(wrapper?.className).toContain('border');
  });

  it('should handle long messages gracefully', () => {
    const longMessage = 'This is a very long message that should wrap properly within the component.';
    render(
      <EmptyState
        title="Long Message"
        message={longMessage}
      />
    );

    expect(screen.getByText(longMessage)).toBeDefined();
  });
});
