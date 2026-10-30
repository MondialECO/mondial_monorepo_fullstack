import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { StaleUpstreamNotice } from '@/components/creator/phase3/StaleUpstreamNotice';

describe('StaleUpstreamNotice', () => {
  it('renders nothing when the output is not stale', () => {
    const { container } = render(<StaleUpstreamNotice stale={false} onRegenerate={vi.fn()} cost={20} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the notice with the server price and regenerates only on click', () => {
    const onRegenerate = vi.fn();
    render(<StaleUpstreamNotice stale onRegenerate={onRegenerate} cost={18} />);

    expect(screen.getByRole('status')).toHaveTextContent('Built on an older version');
    expect(onRegenerate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Regenerate \(18 credits\)/ }));
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('omits the price while the cost is unknown and respects disabled', () => {
    render(<StaleUpstreamNotice stale onRegenerate={vi.fn()} cost={null} disabled />);
    const button = screen.getByRole('button', { name: 'Regenerate' });
    expect(button).toBeDisabled();
  });
});
