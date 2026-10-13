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

const { parseProfileInput } = await loadTypeScriptModule("lib/profile/input.ts");

function formData(values = {}) {
  const data = new FormData();

  for (const [key, value] of Object.entries(values)) {
    data.set(key, value);
  }

  return data;
}

assert.deepEqual(
  parseProfileInput(
    formData({
      fullName: "  Ada Lovelace  ",
      phone: "  +48 123 456 789  ",
      locale: "pl_PL",
    }),
  ),
  {
    ok: true,
    value: {
      fullName: "Ada Lovelace",
      phone: "+48 123 456 789",
      locale: "pl-PL",
    },
  },
);

assert.deepEqual(
  parseProfileInput(
    formData({
      fullName: "   ",
      phone: "   ",
      locale: "en-US",
    }),
  ),
  {
    ok: true,
    value: {
      fullName: null,
      phone: null,
      locale: "en-US",
    },
  },
);

for (const [field, value, expectedMessage] of [
  [
    "fullName",
    "a".repeat(121),
    "Name must be 120 characters or fewer and contain visible text",
  ],
  [
    "fullName",
    "Ada\u200BLovelace",
    "Name must be 120 characters or fewer and contain visible text",
  ],
  [
    "phone",
    "1".repeat(41),
    "Phone must be 40 characters or fewer and contain visible text",
  ],
  [
    "phone",
    "+48\u0000123",
    "Phone must be 40 characters or fewer and contain visible text",
  ],
]) {
  const result = parseProfileInput(
    formData({
      fullName: field === "fullName" ? value : "Ada Lovelace",
      phone: field === "phone" ? value : "+48 123 456 789",
      locale: "en-US",
    }),
  );

  assert.deepEqual(result, { ok: false, message: expectedMessage });
}

for (const locale of ["", "not a locale", "x".repeat(36)]) {
  assert.deepEqual(
    parseProfileInput(
      formData({
        fullName: "Ada Lovelace",
        phone: "+48 123 456 789",
        locale,
      }),
    ),
    { ok: false, message: "Enter a valid locale" },
  );
}

console.log("Profile input validation passed.");
