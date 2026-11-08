'use client';

import { useEffect } from 'react';
import { useCurrentUser } from '@/features/auth/use-auth';
import { applyTheme, storedTheme } from '@/lib/theme';

/**
 * The account is the source of truth for the theme (it follows you to every
 * device). When the account says something different from this browser's
 * local copy, the account wins. Renders nothing.
 */
export function ThemeSync() {
  const { data: user } = useCurrentUser();
  const accountTheme = user?.preferences.theme;

  useEffect(() => {
    if (accountTheme && accountTheme !== storedTheme()) {
      applyTheme(accountTheme);
    }
  }, [accountTheme]);

  return null;
}
