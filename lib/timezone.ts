const fallbackTimeZones = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/Lisbon",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Warsaw",
  "Pacific/Auckland",
] as const;

export function canonicalizeTimeZone(value: string): string | null {
  const candidate = value.trim();

  if (!candidate) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: candidate })
      .resolvedOptions()
      .timeZone;
  } catch {
    return null;
  }
}

export function getSupportedTimeZones(currentTimeZone?: string): string[] {
  let supportedTimeZones: string[];

  try {
    supportedTimeZones = Intl.supportedValuesOf("timeZone");
  } catch {
    supportedTimeZones = [...fallbackTimeZones];
  }

  const timeZones = new Set<string>(["UTC", ...supportedTimeZones]);
  const canonicalCurrentTimeZone = currentTimeZone
    ? canonicalizeTimeZone(currentTimeZone)
    : null;

  if (canonicalCurrentTimeZone) {
    timeZones.add(canonicalCurrentTimeZone);
  }

  return [...timeZones].sort((left, right) => left.localeCompare(right));
}
