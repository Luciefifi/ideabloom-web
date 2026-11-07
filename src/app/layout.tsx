import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

// next/font downloads Inter at build time and serves it from our own app:
// no request to Google from the user's browser, and no layout shift.
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'IdeaBloom',
    template: '%s · IdeaBloom',
  },
  description:
    'Your ideas, in full bloom. Capture ideas and grow them into projects, tasks and notes.',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
