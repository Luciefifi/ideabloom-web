import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, mockApi, renderWithProviders } from '@/test/render';
import { QuickCapture } from './quick-capture';

describe('QuickCapture', () => {
  it('saves the idea on Enter, clears the box and keeps focus for the next one', async () => {
    const fetchMock = mockApi({
      'POST /ideas': () =>
        jsonResponse({ id: '1', title: 'Plant watering app' }, 201),
    });
    renderWithProviders(<QuickCapture />);
    const input = screen.getByLabelText('Capture a new idea');

    await userEvent.type(input, '  Plant watering app {Enter}');

    await vi.waitFor(() => expect(input).toHaveValue(''));
    expect(input).toHaveFocus();
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      title: 'Plant watering app',
    });
  });

  it('does nothing for an empty title', async () => {
    const fetchMock = mockApi({});
    renderWithProviders(<QuickCapture />);

    await userEvent.type(
      screen.getByLabelText('Capture a new idea'),
      '   {Enter}',
    );

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Add idea' })).toBeDisabled();
  });
});
