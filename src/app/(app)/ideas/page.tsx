import type { Metadata } from 'next';
import { Settings2Icon } from 'lucide-react';
import Link from 'next/link';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IdeasView } from '@/features/ideas/components/ideas-view';
import { NewIdeaSheet } from '@/features/ideas/components/new-idea-sheet';

export const metadata: Metadata = { title: 'Ideas' };

export default function IdeasPage() {
  return (
    <>
      <PageHeader
        title="Ideas"
        description="Capture ideas quickly and explore them when you're ready."
        actions={
          <>
            <Link
              href="/ideas/organize"
              className={buttonVariants({ variant: 'outline' })}
            >
              <Settings2Icon aria-hidden="true" />
              Organize
            </Link>
            <NewIdeaSheet />
          </>
        }
      />
      {/* IdeasView reads the filters from the URL, which needs a Suspense boundary. */}
      <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
        <IdeasView />
      </Suspense>
    </>
  );
}
