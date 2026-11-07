'use client';

import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/use-auth';
import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';
import { SessionsCard } from './sessions-card';
import { SettingsSection } from './settings-section';

export function SettingsContent() {
  const { data: user, isPending, error } = useCurrentUser();

  if (isPending) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading settings">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !user) {
    return <FormErrorAlert error={error} />;
  }

  return (
    <div>
      <SettingsSection
        title="Profile"
        description="How you appear in IdeaBloom, and the time zone used for your deadlines."
      >
        {/* key: if the user changes (e.g. after re-login), start the form fresh */}
        <ProfileForm key={user.id} user={user} />
      </SettingsSection>

      <SettingsSection
        title="Password"
        description="Use a long password you don't use anywhere else. Changing it logs out your other devices."
      >
        <ChangePasswordForm />
      </SettingsSection>

      <SettingsSection
        title="Sessions"
        description="Devices where you're currently logged in."
      >
        <SessionsCard />
      </SettingsSection>

      <SettingsSection
        title="Appearance & preferences"
        description="Theme and app preferences."
      >
        <p className="text-sm text-muted-foreground">
          Coming in Milestone 8: dark mode and app preferences.
        </p>
      </SettingsSection>
    </div>
  );
}
