import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn utility function', () => {
  it('should merge class names correctly', () => {
    const result = cn('px-2', 'py-1');
    expect(result).toBe('px-2 py-1');
  });

  it('should handle conditional classes', () => {
    const isActive = true;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).toContain('base-class');
    expect(result).toContain('active-class');
  });

  it('should remove false conditional classes', () => {
    const isActive = false;
    const result = cn('base-class', isActive && 'active-class');
    expect(result).not.toContain('active-class');
  });

  it('should handle empty strings', () => {
    const result = cn('px-2', '', 'py-1');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('should resolve tailwind conflicts using twMerge', () => {
    const result = cn('px-2', 'px-4');
    // twMerge should resolve to the last px value
    expect(result).toContain('px-4');
  });

  it('should handle array inputs', () => {
    const classes = ['px-2', 'py-1'];
    const result = cn(...classes);
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
  });

  it('should handle objects', () => {
    const result = cn({
      'px-2': true,
      'py-1': false,
      'text-red-500': true,
    });
    expect(result).toContain('px-2');
    expect(result).not.toContain('py-1');
    expect(result).toContain('text-red-500');
  });

  it('should handle nested arrays', () => {
    const result = cn(['px-2', 'py-1'], 'text-base');
    expect(result).toContain('px-2');
    expect(result).toContain('py-1');
    expect(result).toContain('text-base');
  });

  it('should remove undefined values', () => {
    const isError = false;
    const result = cn('base', isError && 'error-class');
    expect(result.trim()).toBe('base');
  });

  it('should handle responsive classes', () => {
    const result = cn('px-2 md:px-4 lg:px-6');
    expect(result).toContain('px-2');
    expect(result).toContain('md:px-4');
    expect(result).toContain('lg:px-6');
  });

  it('should handle dark mode classes', () => {
    const result = cn('bg-white dark:bg-slate-900', 'text-black dark:text-white');
    expect(result).toContain('bg-white');
    expect(result).toContain('dark:bg-slate-900');
    expect(result).toContain('text-black');
    expect(result).toContain('dark:text-white');
  });

  it('should return empty string for no inputs', () => {
    const result = cn();
    expect(result).toBe('');
  });

  it('should handle complex real-world example', () => {
    const disabled = true;
    const variant = 'primary';

    const result = cn(
      'px-4 py-2 rounded-md font-medium',
      variant === 'primary' && 'bg-blue-500 text-white',
      variant === 'secondary' && 'bg-gray-200 text-black',
      disabled && 'opacity-50 cursor-not-allowed'
    );

    expect(result).toContain('px-4');
    expect(result).toContain('py-2');
    expect(result).toContain('rounded-md');
    expect(result).toContain('font-medium');
    expect(result).toContain('bg-blue-500');
    expect(result).toContain('text-white');
    expect(result).toContain('opacity-50');
    expect(result).toContain('cursor-not-allowed');
    expect(result).not.toContain('bg-gray-200');
  });
});
