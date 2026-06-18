import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

vi.mock('@/lib/api', () => ({
  __esModule: true,
  searchService: {
    unifiedSearch: vi.fn(),
  },
}));

import { searchService } from '@/lib/api';
import { useSearch } from './useSearch';

describe('useSearch', () => {
  beforeEach(() => {
    searchService.unifiedSearch.mockReset();
  });

  it('debounces: 3 calls in 100ms fire 1 fetch', async () => {
    searchService.unifiedSearch.mockResolvedValue({
      data: { results: [], total: 0, signals: { text: 'ok', semantic: 'ok' } },
    });

    const { result } = renderHook(() => useSearch({ debounceMs: 50 }));

    act(() => {
      result.current.run('a');
      result.current.run('ab');
      result.current.run('abc');
    });

    expect(searchService.unifiedSearch).not.toHaveBeenCalled();
    await waitFor(() => expect(searchService.unifiedSearch).toHaveBeenCalledTimes(1));
    expect(searchService.unifiedSearch).toHaveBeenCalledWith('abc', {});
  });

  it('surfaces signals from the response', async () => {
    searchService.unifiedSearch.mockResolvedValue({
      data: {
        results: [],
        total: 0,
        signals: { text: 'ok', semantic: 'degraded' },
      },
    });

    const { result } = renderHook(() => useSearch({ debounceMs: 10 }));
    act(() => result.current.run('cosmos'));
    await waitFor(() => expect(searchService.unifiedSearch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.signals).toEqual({ text: 'ok', semantic: 'degraded' });
  });

  it('captures network errors into error state', async () => {
    searchService.unifiedSearch.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useSearch({ debounceMs: 10 }));
    act(() => result.current.run('x'));
    await waitFor(() => expect(searchService.unifiedSearch).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(result.current.error).toBeTruthy());

    expect(result.current.data).toBeNull();
  });

  it('blank query clears results without firing a fetch', async () => {
    const { result } = renderHook(() => useSearch({ debounceMs: 10 }));
    act(() => result.current.run('   '));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(searchService.unifiedSearch).not.toHaveBeenCalled();
    expect(result.current.data).toBeNull();
  });
});
