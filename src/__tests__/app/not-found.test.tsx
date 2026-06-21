import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotFound from '@/app/not-found';

// Mock next/link since we're testing without the Next.js App Router context
// eslint-disable-next-line @next/next/no-html-link-for-pages
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

describe('NotFound Page', () => {
  it('should render 404 error code', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeDefined();
  });

  it('should render error title', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeDefined();
  });

  it('should render error message', () => {
    render(<NotFound />);
    const message = screen.getByText(/The page you're looking for doesn't exist or has been moved/i);
    expect(message).toBeDefined();
  });

  it('should render back to home link', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toBeDefined();
    expect(link.getAttribute('href')).toBe('/');
  });

  it('should have correct styling classes', () => {
    const { container } = render(<NotFound />);

    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer?.className).toContain('min-h-screen');
    expect(mainContainer?.className).toContain('flex');
    expect(mainContainer?.className).toContain('items-center');
    expect(mainContainer?.className).toContain('justify-center');
  });

  it('should display 404 text with proper styling', () => {
    const { container } = render(<NotFound />);
    const notFoundText = container.querySelector('.text-6xl');

    expect(notFoundText?.textContent).toBe('404');
    expect(notFoundText?.className).toContain('font-bold');
  });

  it('should render link with correct styling', () => {
    const { container } = render(<NotFound />);
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    const link = container.querySelector('a');

    expect(link?.className).toContain('px-6');
    expect(link?.className).toContain('py-3');
    expect(link?.className).toContain('bg-');
    expect(link?.className).toContain('text-white');
    expect(link?.className).toContain('rounded-lg');
    expect(link?.className).toContain('font-medium');
  });

  it('should have responsive padding', () => {
    const { container } = render(<NotFound />);
    const mainContainer = container.querySelector('.px-4');

    expect(mainContainer).toBeDefined();
    expect(mainContainer?.className).toContain('px-4');
  });

  it('should have proper spacing between elements', () => {
    const { container } = render(<NotFound />);
    const spacingContainer = container.querySelector('.space-y-6');

    expect(spacingContainer).toBeDefined();
    expect(spacingContainer?.className).toContain('space-y-6');
  });

  it('should render all required elements', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeDefined();
    expect(screen.getByText('Page not found')).toBeDefined();
    expect(screen.getByRole('link')).toBeDefined();
  });

  it('should structure content vertically centered', () => {
    const { container } = render(<NotFound />);
    const contentWrapper = container.querySelector('.flex.items-center.justify-center');

    expect(contentWrapper).toBeDefined();
  });
});
