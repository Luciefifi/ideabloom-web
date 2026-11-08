import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutosave } from './use-autosave';

interface Draft {
  title: string;
  content: string;
}

describe('useAutosave', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('waits for a pause, then saves all the changes together', async () => {
    const save = vi.fn<(changes: Partial<Draft>) => Promise<void>>(() =>
      Promise.resolve(),
    );
    const { result } = renderHook(() => useAutosave<Draft>(save, 1000));

    act(() => result.current.queue({ title: 'Pl' }));
    act(() => vi.advanceTimersByTime(500));
    act(() => result.current.queue({ title: 'Plan', content: 'Hello' }));
    expect(result.current.status).toBe('unsaved');
    expect(save).not.toHaveBeenCalled();

    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith({ title: 'Plan', content: 'Hello' });
    expect(result.current.status).toBe('saved');
  });

  it('keeps changes after a failed save and sends them again', async () => {
    const save = vi
      .fn<(changes: Partial<Draft>) => Promise<void>>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useAutosave<Draft>(save, 1000));

    act(() => result.current.queue({ content: 'A' }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(result.current.status).toBe('error');

    act(() => result.current.queue({ title: 'T' }));
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(save).toHaveBeenLastCalledWith({ content: 'A', title: 'T' });
    expect(result.current.status).toBe('saved');
  });

  it('saves pending changes when the page is left', async () => {
    const save = vi.fn(() => Promise.resolve());
    const { result, unmount } = renderHook(() =>
      useAutosave<Draft>(save, 1000),
    );

    act(() => result.current.queue({ content: 'Last words' }));
    unmount();
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(save).toHaveBeenCalledWith({ content: 'Last words' });
  });
});
