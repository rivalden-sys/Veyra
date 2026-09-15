const INVISIBLE_CONTROL_CHARACTERS = /[\p{Cc}\p{Cf}]/u;

export type ProfileInput = {
  fullName: string | null;
  phone: string | null;
  locale: string;
};

export type ProfileInputResult =
  | { ok: true; value: ProfileInput }
  | { ok: false; message: string };

function hasInvisibleControlCharacters(value: string) {
  return INVISIBLE_CONTROL_CHARACTERS.test(value);
}

export function parseProfileInput(formData: FormData): ProfileInputResult {
  const rawFullName = String(formData.get("fullName") ?? "");
  const rawPhone = String(formData.get("phone") ?? "");
  const rawLocale = String(formData.get("locale") ?? "");

  if (
    rawFullName.length > 120 ||
    hasInvisibleControlCharacters(rawFullName)
  ) {
    return {
      ok: false,
      message: "Name must be 120 characters or fewer and contain visible text",
    };
  }

  if (rawPhone.length > 40 || hasInvisibleControlCharacters(rawPhone)) {
    return {
      ok: false,
      message: "Phone must be 40 characters or fewer and contain visible text",
    };
  }

  const localeCandidate = rawLocale.trim().replaceAll("_", "-");

  if (!localeCandidate || localeCandidate.length > 35) {
    return { ok: false, message: "Enter a valid locale" };
  }

  let locale: string;
  try {
    locale = new Intl.Locale(localeCandidate).toString();
  } catch {
    return { ok: false, message: "Enter a valid locale" };
  }

  return {
    ok: true,
    value: {
      fullName: rawFullName.trim() || null,
      phone: rawPhone.trim() || null,
      locale,
    },
  };
}
