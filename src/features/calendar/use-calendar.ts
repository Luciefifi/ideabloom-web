'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { summaryKeys } from '@/lib/summary-keys';
import type { CalendarResponse } from './types';

/** Dated items between two days. Kept fresh like the dashboard (see summaryKeys). */
export function useCalendar(from: string, to: string) {
  return useQuery({
    queryKey: [...summaryKeys.calendar, from, to],
    queryFn: () => api.get<CalendarResponse>(`/calendar?from=${from}&to=${to}`),
    placeholderData: keepPreviousData,
  });
}
