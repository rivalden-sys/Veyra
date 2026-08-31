const DEFAULT_AUTH_NEXT = "/dashboard";
const LOCAL_DEVELOPMENT_ORIGIN = "http://localhost:3000";
const SAFE_NEXT_BASE_ORIGIN = "https://veyra.invalid";
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

export function safeAuthNext(value: unknown): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return DEFAULT_AUTH_NEXT;
  }

  let decodedValue: string;

  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    return DEFAULT_AUTH_NEXT;
  }

  if (
    decodedValue.startsWith("//") ||
    decodedValue.includes("\\") ||
    CONTROL_CHARACTERS.test(decodedValue)
  ) {
    return DEFAULT_AUTH_NEXT;
  }

  try {
    const target = new URL(value, SAFE_NEXT_BASE_ORIGIN);

    if (target.origin !== SAFE_NEXT_BASE_ORIGIN) {
      return DEFAULT_AUTH_NEXT;
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return DEFAULT_AUTH_NEXT;
  }
}

export function resolveAppOrigin(
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv = process.env.NODE_ENV,
): string {
  const configuredValue = configuredSiteUrl?.trim();

  if (!configuredValue) {
    if (nodeEnv === "production") {
      throw new Error("NEXT_PUBLIC_SITE_URL is required in production");
    }

    return LOCAL_DEVELOPMENT_ORIGIN;
  }

  let configuredUrl: URL;

  try {
    configuredUrl = new URL(configuredValue);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL must be a valid absolute URL");
  }

  if (configuredUrl.protocol !== "http:" && configuredUrl.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use http or https");
  }

  if (
    configuredUrl.username ||
    configuredUrl.password ||
    configuredUrl.search ||
    configuredUrl.hash ||
    (configuredUrl.pathname && configuredUrl.pathname !== "/")
  ) {
    throw new Error("NEXT_PUBLIC_SITE_URL must contain only the application origin");
  }

  return configuredUrl.origin;
}

export function buildAppUrl(
  path: string,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv = process.env.NODE_ENV,
): string {
  const origin = resolveAppOrigin(configuredSiteUrl, nodeEnv);
  const target = new URL(path, `${origin}/`);

  if (target.origin !== origin) {
    throw new Error("Application redirect path must stay on the canonical origin");
  }

  return target.toString();
}

export function buildAuthCallbackUrl(
  next: unknown,
  configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL,
  nodeEnv = process.env.NODE_ENV,
): string {
  const callbackUrl = new URL(
    "/auth/callback",
    `${resolveAppOrigin(configuredSiteUrl, nodeEnv)}/`,
  );

  callbackUrl.searchParams.set("next", safeAuthNext(next));

  return callbackUrl.toString();
}
