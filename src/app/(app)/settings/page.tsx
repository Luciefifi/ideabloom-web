import type { Metadata } from 'next';
import { Settings } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Your profile, account security and preferences."
      />
      <EmptyState
        icon={Settings}
        title="Settings are coming soon"
        description="Profile and password come with accounts; themes and preferences follow later. (Milestone 1 and 8)"
      />
    </>
  );
}
