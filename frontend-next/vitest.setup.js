import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

// jsdom 25 doesn't always expose Web Storage; provide a tiny shim so
// production code that reads window.localStorage works in tests.
if (typeof window !== 'undefined' && !window.localStorage) {
  const store = new Map();
  const storage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (i) => Array.from(store.keys())[i] ?? null,
    get length() {
      return store.size;
    },
  };
  Object.defineProperty(window, 'localStorage', {
    value: storage,
    writable: false,
    configurable: true,
  });
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    writable: false,
    configurable: true,
  });
}

// next/navigation: mock the hooks our components use so they work in
// component-level tests without a Next runtime.
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// next/link renders a plain <a> in tests so RTL can query by role/text.
vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...rest }) =>
      React.createElement(
        'a',
        { href: typeof href === 'string' ? href : '#', ...rest },
        children
      ),
  };
});

// Mock stompjs and sockjs-client globally to prevent JSDom evaluation issues
vi.mock('@stomp/stompjs', () => ({
  Client: vi.fn().mockImplementation(() => ({
    activate: vi.fn(),
    deactivate: vi.fn(),
    subscribe: vi.fn(),
    publish: vi.fn(),
  })),
}));

vi.mock('sockjs-client', () => {
  return {
    default: vi.fn().mockImplementation(() => ({})),
  };
});

