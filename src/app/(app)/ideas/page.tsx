import type { Metadata } from 'next';
import { Lightbulb } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { PageHeader } from '@/components/shared/page-header';

export const metadata: Metadata = { title: 'Ideas' };

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        title="Ideas"
        description="Capture ideas quickly and explore them when you are ready."
      />
      <EmptyState
        icon={Lightbulb}
        title="No ideas yet"
        description="Ideas are the heart of IdeaBloom. Quick capture, tags, categories, favourites and archiving are coming next. (Milestone 2)"
      />
    </>
  );
}
