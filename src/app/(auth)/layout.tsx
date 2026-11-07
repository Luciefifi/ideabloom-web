import Link from 'next/link';
import { Logo } from '@/components/brand/logo';

/**
 * Layout for login, registration and password pages: a centred card on a
 * soft lavender background, without the app sidebar.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--lavender-soft),transparent_60%)] px-4 py-10">
      <Link href="/" aria-label="IdeaBloom home" className="mb-8">
        <Logo />
      </Link>
      {children}
    </main>
  );
}
