'use client';

import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { errorMessage } from '@/components/forms/form-error-alert';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import {
  START_PAGES,
  type Preferences,
  type StartPage,
  type User,
} from '@/features/auth/api';
import { useUpdateProfile } from '@/features/auth/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { cn } from '@/lib/utils';
import { THEMES, type Theme } from '@/lib/theme';

const THEME_OPTIONS: Record<Theme, { label: string; icon: LucideIcon }> = {
  light: { label: 'Light', icon: SunIcon },
  dark: { label: 'Dark', icon: MoonIcon },
  system: { label: 'System', icon: MonitorIcon },
};

const START_PAGE_LABELS: Record<StartPage, string> = {
  dashboard: 'Dashboard',
  ideas: 'Ideas',
  tasks: 'Tasks',
};

/** Theme and start page. Both save as soon as you choose. */
export function AppearanceForm({ user }: { user: User }) {
  const { theme, setTheme } = useTheme();
  const update = useUpdateProfile();
  const save = (preferences: Partial<Preferences>, done: string) =>
    update.mutate(
      { preferences },
      {
        onSuccess: () => toast.success(done),
        onError: (e) => toast.error(`Couldn't save. ${errorMessage(e)}`),
      },
    );

  return (
    <div className="space-y-6">
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Theme</legend>
        <div className="grid grid-cols-3 gap-2 sm:max-w-md">
          {THEMES.map((option) => {
            const { label, icon: Icon } = THEME_OPTIONS[option];
            const checked = theme === option;
            return (
              <label
                key={option}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border bg-card p-3 text-sm transition-colors has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50',
                  checked
                    ? 'border-primary bg-lavender-soft font-medium'
                    : 'hover:border-lavender',
                )}
              >
                <input
                  type="radio"
                  name="theme"
                  value={option}
                  checked={checked}
                  onChange={() => {
                    setTheme(option); // instantly, on this device
                    save({ theme: option }, `Theme: ${label}`); // and on your account
                  }}
                  className="sr-only"
                />
                <Icon className="size-5" aria-hidden="true" />
                {label}
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          System follows your computer or phone&apos;s setting. Your choice is
          saved to your account, so it follows you to every device.
        </p>
      </fieldset>

      <div className="space-y-1.5">
        <label htmlFor="start-page" className="text-sm font-medium">
          Start page
        </label>
        <NativeSelect
          id="start-page"
          className="w-full sm:w-64"
          value={user.preferences.startPage}
          disabled={update.isPending}
          onChange={(e) => {
            const page = e.target.value as StartPage;
            save({ startPage: page }, `Start page: ${START_PAGE_LABELS[page]}`);
          }}
        >
          {START_PAGES.map((page) => (
            <NativeSelectOption key={page} value={page}>
              {START_PAGE_LABELS[page]}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        <p className="text-xs text-muted-foreground">
          The page that opens after you log in.
        </p>
      </div>
    </div>
  );
}
