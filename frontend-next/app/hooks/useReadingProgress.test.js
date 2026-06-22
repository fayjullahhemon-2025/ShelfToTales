import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '@/lib/api';
import { useReadingProgress } from './useReadingProgress';

describe('useReadingProgress', () => {
  beforeEach(() => {
    // The unmount-flush PATCH in production carries the JWT read from
    // window.localStorage by app/lib/api.js. Without a token shim here
    // the hook's cleanup would fire a 401 the same way the reader page
    // would before the user logged in.
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('token', 'test-token');
    }
    api.get.mockReset();
    api.patch.mockReset();
  });

  it('hydrates the initial page from the backend on mount', async () => {
    api.get.mockResolvedValueOnce({ data: { currentPage: 17, totalPages: 300, lastReadAt: '2026-06-12T10:00:00' } });
    const { result } = renderHook(() => useReadingProgress({ bookId: 7, debounceMs: 1000 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(api.get).toHaveBeenCalledWith('/reading-progress', { params: { bookId: 7 } });
    expect(result.current.currentPage).toBe(17);
    expect(result.current.totalPages).toBe(300);
  });

  it('debounces saveProgress so rapid page changes only fire one PATCH', async () => {
    api.get.mockResolvedValueOnce({ data: { currentPage: 0, totalPages: 100, lastReadAt: null } });
    api.patch.mockResolvedValue({ data: { currentPage: 7, totalPages: 0, lastReadAt: 'x' } });
    const { result } = renderHook(() => useReadingProgress({ bookId: 7, debounceMs: 10 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.savePage(5);
      result.current.savePage(6);
      result.current.savePage(7);
    });

    // Before the debounce window closes, no PATCH should have fired
    expect(api.patch).not.toHaveBeenCalled();

    // Wait for the debounce + PATCH
    await waitFor(() => expect(api.patch).toHaveBeenCalledTimes(1));
    expect(api.patch).toHaveBeenCalledWith(
      '/reading-progress',
      { currentPage: 7 },
      { params: { bookId: 7 } }
    );
  });

  it('returns a currentPage of 0 when the backend reports no progress', async () => {
    api.get.mockResolvedValueOnce({ data: { currentPage: 0, totalPages: 0, lastReadAt: null } });
    const { result } = renderHook(() => useReadingProgress({ bookId: 7, debounceMs: 1000 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.currentPage).toBe(0);
  });

  it('captures backend errors into the error state', async () => {
    api.get.mockRejectedValueOnce(new Error('network'));
    const { result } = renderHook(() => useReadingProgress({ bookId: 7, debounceMs: 1000 }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it('flushes pending page when the reader unmounts', async () => {
    api.get.mockResolvedValueOnce({ data: { currentPage: 0, totalPages: 100, lastReadAt: null } });
    api.patch.mockResolvedValue({ data: { currentPage: 9, totalPages: 100, lastReadAt: 'x' } });
    const { result, unmount } = renderHook(() => useReadingProgress({ bookId: 7, debounceMs: 1000 }));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => result.current.savePage(9));
    unmount();

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
      '/reading-progress',
      { currentPage: 9 },
      { params: { bookId: 7 } }
    ));
  });
});
