import { readFileSync } from "node:fs";

const acceptedTimeZones = [
  "UTC",
  "Europe/Warsaw",
  "America/New_York",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const rejectedTimeZones = [
  "",
  "Mars/Olympus_Mons",
  "Europe/Not_A_City",
  "../../UTC",
];

function canonicalizeTimeZone(value) {
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

function resolveOnboardingTimeZone(value) {
  const requestedTimeZone = value === undefined ? "UTC" : String(value).trim();
  return canonicalizeTimeZone(requestedTimeZone);
}

for (const timeZone of acceptedTimeZones) {
  if (!canonicalizeTimeZone(timeZone)) {
    throw new Error(`Expected timezone to be accepted: ${timeZone}`);
  }
}

for (const timeZone of rejectedTimeZones) {
  if (canonicalizeTimeZone(timeZone)) {
    throw new Error(`Expected timezone to be rejected: ${timeZone}`);
  }
}

if (resolveOnboardingTimeZone(undefined) !== "UTC") {
  throw new Error("Missing onboarding timezone should deliberately default to UTC");
}

if (resolveOnboardingTimeZone("Asia/Tokyo") !== "Asia/Tokyo") {
  throw new Error("A valid onboarding IANA timezone must not be coerced to UTC");
}

if (resolveOnboardingTimeZone("Mars/Olympus_Mons") !== null) {
  throw new Error("Invalid onboarding timezone should be rejected");
}

const supportedTimeZones = Intl.supportedValuesOf("timeZone");

if (!supportedTimeZones.includes("Europe/Warsaw")) {
  throw new Error("Runtime timezone data does not include Europe/Warsaw");
}

const onboardingActionSource = readFileSync(
  new URL("../app/onboarding/actions.ts", import.meta.url),
  "utf8",
);
const onboardingPageSource = readFileSync(
  new URL("../app/onboarding/page.tsx", import.meta.url),
  "utf8",
);
const settingsPageSource = readFileSync(
  new URL("../app/(dashboard)/settings/page.tsx", import.meta.url),
  "utf8",
);

if (onboardingActionSource.includes("allowedTimezones")) {
  throw new Error("Onboarding must not reintroduce a hard-coded timezone allowlist");
}

if (!onboardingActionSource.includes("canonicalizeTimeZone")) {
  throw new Error("Onboarding server action must use shared timezone canonicalization");
}

for (const source of [onboardingPageSource, settingsPageSource]) {
  if (!source.includes("getSupportedTimeZones") || !source.includes("groupTimeZones")) {
    throw new Error(
      "Onboarding and Settings must use the shared timezone source and grouping helper",
    );
  }
}

console.log("Timezone validation passed.");
