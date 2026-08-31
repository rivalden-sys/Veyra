import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");

async function loadTypeScriptModule(relativePath) {
  const source = readFileSync(join(repositoryRoot, relativePath), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: relativePath,
  }).outputText;
  const encoded = Buffer.from(output, "utf8").toString("base64");
  return import(`data:text/javascript;base64,${encoded}`);
}

const routing = await loadTypeScriptModule("lib/auth/routing.ts");
const authErrors = await loadTypeScriptModule("lib/auth/errors.ts");

assert.equal(routing.safeAuthNext(undefined), "/dashboard");
assert.equal(routing.safeAuthNext(null), "/dashboard");
assert.equal(routing.safeAuthNext(""), "/dashboard");
assert.equal(routing.safeAuthNext("/dashboard"), "/dashboard");
assert.equal(
  routing.safeAuthNext("/invite/abc123?source=email#accept"),
  "/invite/abc123?source=email#accept",
);

for (const unsafeNext of [
  "https://evil.example/path",
  "//evil.example/path",
  "/\\evil.example/path",
  "/%5C%5Cevil.example/path",
  "/%2F%2Fevil.example/path",
  "javascript:alert(1)",
  "/%00dashboard",
  "%2F%2Fevil.example/path",
]) {
  assert.equal(
    routing.safeAuthNext(unsafeNext),
    "/dashboard",
    `unsafe next value must fall back: ${unsafeNext}`,
  );
}

assert.equal(
  routing.resolveAppOrigin("https://app.example.com/", "production"),
  "https://app.example.com",
);
assert.equal(
  routing.resolveAppOrigin(undefined, "development"),
  "http://localhost:3000",
);
assert.throws(
  () => routing.resolveAppOrigin(undefined, "production"),
  /NEXT_PUBLIC_SITE_URL is required/,
);
assert.throws(
  () => routing.resolveAppOrigin("ftp://app.example.com", "production"),
  /http or https/,
);
assert.throws(
  () => routing.resolveAppOrigin("https://app.example.com/base", "production"),
  /only the application origin/,
);
assert.throws(
  () => routing.resolveAppOrigin("https://app.example.com/?preview=1", "production"),
  /only the application origin/,
);

assert.equal(
  routing.buildAuthCallbackUrl(
    "/invite/abc123?source=email",
    "https://app.example.com",
    "production",
  ),
  "https://app.example.com/auth/callback?next=%2Finvite%2Fabc123%3Fsource%3Demail",
);
assert.equal(
  routing.buildAuthCallbackUrl("//evil.example", undefined, "development"),
  "http://localhost:3000/auth/callback?next=%2Fdashboard",
);
assert.equal(
  routing.buildAppUrl("/login?error=auth_exchange_failed", "https://app.example.com", "production"),
  "https://app.example.com/login?error=auth_exchange_failed",
);
assert.throws(
  () => routing.buildAppUrl("//evil.example/path", "https://app.example.com", "production"),
  /canonical origin/,
);

assert.equal(
  authErrors.authErrorMessage("auth_exchange_failed"),
  "We couldn't complete sign-in. Please try again.",
);
assert.equal(authErrors.authErrorMessage("raw-provider-error"), null);

const actionsSource = readFileSync(
  join(repositoryRoot, "app", "(auth)", "login", "actions.ts"),
  "utf8",
);
const callbackSource = readFileSync(
  join(repositoryRoot, "app", "auth", "callback", "route.ts"),
  "utf8",
);
const signOutSource = readFileSync(
  join(repositoryRoot, "app", "auth", "sign-out", "route.ts"),
  "utf8",
);
const loginPageSource = readFileSync(
  join(repositoryRoot, "app", "(auth)", "login", "page.tsx"),
  "utf8",
);

assert.match(actionsSource, /buildAuthCallbackUrl/);
assert.match(actionsSource, /safeAuthNext/);
assert.doesNotMatch(actionsSource, /from "next\/headers"/);
assert.doesNotMatch(actionsSource, /error\.message/);
assert.doesNotMatch(actionsSource, /NEXT_PUBLIC_SITE_URL/);

assert.match(callbackSource, /buildAppUrl/);
assert.match(callbackSource, /safeAuthNext/);
assert.doesNotMatch(callbackSource, /requestUrl\.origin/);
assert.doesNotMatch(callbackSource, /error\.message/);

assert.match(signOutSource, /export async function POST/);
assert.doesNotMatch(signOutSource, /export async function GET/);
assert.match(signOutSource, /NextResponse\.redirect\(buildAppUrl\("\/login"\), 303\)/);

assert.match(loginPageSource, /authErrorMessage\(params\.error\)/);
assert.match(loginPageSource, /role="alert"/);
assert.match(loginPageSource, /role="status"/);
assert.doesNotMatch(loginPageSource, /params\.email/);

console.log("Auth routing validation passed.");
