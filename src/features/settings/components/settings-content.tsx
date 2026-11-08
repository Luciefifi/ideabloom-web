'use client';

import { FormErrorAlert } from '@/components/forms/form-error-alert';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/features/auth/use-auth';
import { useHydrated } from '@/hooks/use-hydrated';
import { DeleteAccount, DownloadData } from './account-data';
import { AppearanceForm } from './appearance-form';
import { ChangePasswordForm } from './change-password-form';
import { ProfileForm } from './profile-form';
import { SessionsCard } from './sessions-card';
import { SettingsSection } from './settings-section';

export function SettingsContent() {
  const { data: user, isPending, error } = useCurrentUser();
  const hydrated = useHydrated();

  // Same as the server on the first render (see useHydrated).
  if (isPending || !hydrated) {
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
        title="Appearance & preferences"
        description="How IdeaBloom looks, and where it opens."
      >
        <AppearanceForm user={user} />
      </SettingsSection>

      <SettingsSection
        title="Signed-in devices"
        description="Where you're logged in right now."
      >
        <SessionsCard />
      </SettingsSection>

      <SettingsSection
        title="Your data"
        description="Take a copy of everything you've created."
      >
        <DownloadData />
      </SettingsSection>

      <SettingsSection
        title="Delete account"
        description="Permanently remove your account and all its content."
      >
        <DeleteAccount />
      </SettingsSection>
    </div>
  );
}
