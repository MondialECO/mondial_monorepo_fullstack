import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next/image
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    const { alt, ...rest } = props;
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'img',
      props: { ...rest, alt },
      key: null,
      ref: null,
    };
  },
}));

// Mock next/link
vi.mock('next/link', () => ({
  __esModule: true,
  default: (props: any) => {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'a',
      props: { ...props },
      key: null,
      ref: null,
    };
  },
}));

// Global test utilities
declare global {
  var mockAxios: any;
}

// Setup global mocks if needed
globalThis.matchMedia =
  globalThis.matchMedia ||
  function () {
    return {
      addListener: vi.fn(),
      removeListener: vi.fn(),
      matches: false,
    };
  };

// Polyfill for Document.elementFromPoint (used by Tiptap/ProseMirror)
// happy-dom doesn't implement elementFromPoint, so we provide a basic one
if (typeof Document.prototype.elementFromPoint !== 'function') {
  Document.prototype.elementFromPoint = function () {
    // Return the root element or body as a fallback
    return this.body || this.documentElement;
  };
}

// Mock global alert for tests that parse HTML with scripts
if (typeof globalThis.alert !== 'function') {
  globalThis.alert = vi.fn();
}
