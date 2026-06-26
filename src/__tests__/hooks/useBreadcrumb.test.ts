import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBreadcrumb } from '@/hooks/useBreadcrumb';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

let mockPathname = '';

describe('useBreadcrumb Hook', () => {
  beforeEach(() => {
    mockPathname = '';
  });

  it('should return empty array for root path', () => {
    mockPathname = '/';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([]);
  });

  it('should generate breadcrumbs for single segment path', () => {
    mockPathname = '/dashboard';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([
      {
        label: 'Dashboard',
        href: '/dashboard',
      },
    ]);
  });

  it('should generate breadcrumbs for multi-segment path', () => {
    mockPathname = '/dashboard/entrepreneur/phase-1';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([
      {
        label: 'Dashboard',
        href: '/dashboard',
      },
      {
        label: 'Entrepreneur',
        href: '/dashboard/entrepreneur',
      },
      {
        label: 'Phase 1',
        href: '/dashboard/entrepreneur/phase-1',
      },
    ]);
  });

  it('should format labels by replacing hyphens with spaces', () => {
    mockPathname = '/dashboard/creator/create-project';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current[2].label).toBe('Create Project');
  });

  it('should capitalize first letter of each word', () => {
    mockPathname = '/my/awesome/path';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([
      {
        label: 'My',
        href: '/my',
      },
      {
        label: 'Awesome',
        href: '/my/awesome',
      },
      {
        label: 'Path',
        href: '/my/awesome/path',
      },
    ]);
  });

  it('should handle paths with trailing slashes', () => {
    mockPathname = '/dashboard/entrepreneur/';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toHaveLength(2);
    expect(result.current[1].label).toBe('Entrepreneur');
  });

  it('should build correct href paths incrementally', () => {
    mockPathname = '/app/admin/users/123';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([
      { label: 'App', href: '/app' },
      { label: 'Admin', href: '/app/admin' },
      { label: 'Users', href: '/app/admin/users' },
      { label: '123', href: '/app/admin/users/123' },
    ]);
  });

  it('should handle special characters in path segments', () => {
    mockPathname = '/dashboard/phase-2-step-1';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current[1].label).toBe('Phase 2 Step 1');
  });

  it('should handle empty pathname', () => {
    mockPathname = '';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toEqual([]);
  });

  it('should handle very long paths', () => {
    mockPathname = '/level1/level2/level3/level4/level5/level6';
    const { result } = renderHook(() => useBreadcrumb());

    expect(result.current).toHaveLength(6);
    expect(result.current[5].href).toBe('/level1/level2/level3/level4/level5/level6');
  });
});
