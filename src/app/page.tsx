import { redirect } from 'next/navigation';

/**
 * "/" has no page of its own: send people to the dashboard.
 * From Milestone 1, logged-out visitors will be sent to /login instead.
 */
export default function HomePage() {
  redirect('/dashboard');
}
