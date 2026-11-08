import { ArrowLeftIcon } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { CategoryManager } from '@/features/ideas/components/category-manager';
import { TagManager } from '@/features/ideas/components/tag-manager';
import { SettingsSection } from '@/features/settings/components/settings-section';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Organize ideas' };

export default function OrganizeIdeasPage() {
  return (
    <>
      <Link
        href="/ideas"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          'mb-2 -ml-2',
        )}
      >
        <ArrowLeftIcon aria-hidden="true" />
        All ideas
      </Link>
      <PageHeader
        title="Organize"
        description="Categories group your ideas; tags label them. Both can be used to filter."
      />
      <SettingsSection
        title="Categories"
        description="One category per idea, each with its own colour."
      >
        <CategoryManager />
      </SettingsSection>
      <SettingsSection
        title="Tags"
        description="Rename or remove tags. New tags are created while editing an idea."
      >
        <TagManager />
      </SettingsSection>
    </>
  );
}
