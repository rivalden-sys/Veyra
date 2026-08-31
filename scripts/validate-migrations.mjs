import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = join(scriptDirectory, "..");
const migrationsDirectory = join(repositoryRoot, "supabase", "migrations");
const readmePath = join(repositoryRoot, "README.md");
const migrationPattern = /^(\d{14})_[a-z0-9_]+\.sql$/;

const migrationFiles = readdirSync(migrationsDirectory)
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort((left, right) => left.localeCompare(right));

if (migrationFiles.length === 0) {
  throw new Error("No SQL migrations found in supabase/migrations");
}

const versions = new Map();
const contentHashes = new Map();

for (const fileName of migrationFiles) {
  const match = fileName.match(migrationPattern);

  if (!match) {
    throw new Error(
      `Migration filename must use <14-digit timestamp>_<snake_case_name>.sql: ${fileName}`,
    );
  }

  const version = match[1];
  const existingVersion = versions.get(version);

  if (existingVersion) {
    throw new Error(
      `Duplicate migration version ${version}: ${existingVersion} and ${fileName}`,
    );
  }

  versions.set(version, fileName);

  const content = readFileSync(join(migrationsDirectory, fileName));
  const contentHash = createHash("sha256").update(content).digest("hex");
  const existingContent = contentHashes.get(contentHash);

  if (existingContent) {
    throw new Error(
      `Duplicate migration content: ${existingContent} and ${fileName}`,
    );
  }

  contentHashes.set(contentHash, fileName);
}

const readme = readFileSync(readmePath, "utf8");
const ledgerMatch = readme.match(
  /<!-- migration-ledger:start -->\s*```text\s*([\s\S]*?)```\s*<!-- migration-ledger:end -->/,
);

if (!ledgerMatch) {
  throw new Error("README migration ledger markers are missing or malformed");
}

const documentedMigrations = ledgerMatch[1]
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

if (JSON.stringify(documentedMigrations) !== JSON.stringify(migrationFiles)) {
  throw new Error(
    [
      "README migration ledger is out of sync with supabase/migrations.",
      `Expected: ${migrationFiles.join(", ")}`,
      `Documented: ${documentedMigrations.join(", ")}`,
    ].join("\n"),
  );
}

console.log(`Migration ledger validation passed (${migrationFiles.length} files).`);
