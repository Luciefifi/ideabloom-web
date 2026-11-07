import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsContent } from '@/features/settings/components/settings-content';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, password and account security."
      />
      <SettingsContent />
    </>
  );
}
