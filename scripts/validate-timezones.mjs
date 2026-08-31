const acceptedTimeZones = [
  "UTC",
  "Europe/Warsaw",
  "America/New_York",
  "Asia/Tokyo",
  "Australia/Sydney",
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

const supportedTimeZones = Intl.supportedValuesOf("timeZone");

if (!supportedTimeZones.includes("Europe/Warsaw")) {
  throw new Error("Runtime timezone data does not include Europe/Warsaw");
}

console.log("Timezone validation passed.");
