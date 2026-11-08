/**
 * Queries that summarise everything (the dashboard and the activity feed).
 * Any successful change in the app makes them stale (see AppProviders), so
 * they're fresh the next time they're shown, without every feature having to
 * remember to refresh them.
 */
export const summaryKeys = {
  dashboard: ['dashboard'] as const,
  activity: ['activity'] as const,
};
