/**
 * IANA time zone names ("Africa/Kigali", "Europe/London"…) known to this
 * browser. "UTC" isn't in the browser's list, but it's the default for new
 * accounts, so it's added at the top.
 */
export function getTimeZones(current?: string): string[] {
  const zones =
    typeof Intl.supportedValuesOf === 'function'
      ? Intl.supportedValuesOf('timeZone')
      : [];
  const list = ['UTC', ...zones.filter((zone) => zone !== 'UTC')];
  // Keep a saved value selectable even if this browser doesn't list it.
  if (current && !list.includes(current)) {
    list.unshift(current);
  }
  return list;
}

/** The time zone this device is set to, e.g. "Africa/Kigali". */
export function getDeviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return undefined;
  }
}

/** "Africa/Kigali" → "Africa / Kigali", "America/Argentina/Buenos_Aires" → "America / Argentina / Buenos Aires" */
export function formatTimeZone(zone: string): string {
  return zone.replaceAll('_', ' ').replaceAll('/', ' / ');
}
