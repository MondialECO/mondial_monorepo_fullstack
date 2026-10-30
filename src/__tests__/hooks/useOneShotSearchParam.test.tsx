import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOneShotSearchParam } from '@/hooks/useOneShotSearchParam';

const replace = vi.fn();
let query = '';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace, push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/dashboard/creator/phase-2/clarifier',
  useSearchParams: () => new URLSearchParams(query),
}));

describe('useOneShotSearchParam', () => {
  beforeEach(() => {
    replace.mockReset();
  });

  it('strips the flag from the URL immediately, keeping other params', () => {
    query = 'ideaId=idea-1&regenerate=1';
    renderHook(() => useOneShotSearchParam('regenerate'));

    expect(replace).toHaveBeenCalledWith('/dashboard/creator/phase-2/clarifier?ideaId=idea-1', { scroll: false });
  });

  it('fires at most once, even across re-renders', () => {
    query = 'regenerate=1';
    const { result, rerender } = renderHook(() => useOneShotSearchParam('regenerate'));

    expect(result.current()).toBe(true);
    rerender();
    expect(result.current()).toBe(false);
  });

  it('does nothing without the flag (e.g. after a refresh of the cleaned URL)', () => {
    query = 'ideaId=idea-1';
    const { result } = renderHook(() => useOneShotSearchParam('regenerate'));

    expect(result.current()).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });
});
