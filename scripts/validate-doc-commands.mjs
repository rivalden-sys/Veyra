import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documents = ['README.md', 'CONTRIBUTING.md', 'docs/TESTING.md'];
const packageJson = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts ?? {};
const failures = [];
let checked = 0;

for (const document of documents) {
  const filename = resolve(root, document);
  if (!existsSync(filename)) {
    failures.push(`${document}: document is missing`);
    continue;
  }

  const content = readFileSync(filename, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    for (const match of line.matchAll(/\bnpm\s+run\s+([\w:-]+)/g)) {
      checked += 1;
      if (!Object.hasOwn(scripts, match[1])) {
        failures.push(`${document}:${index + 1}: npm script "${match[1]}" is not defined`);
      }
    }

    for (const match of line.matchAll(/\bnode\s+((?:\.\/)?scripts\/[\w./-]+\.mjs)\b/g)) {
      checked += 1;
      const relativePath = match[1].replace(/^\.\//, '');
      const target = resolve(root, relativePath);
      if (!target.startsWith(`${root}${sep}`) || !existsSync(target) || !statSync(target).isFile()) {
        failures.push(`${document}:${index + 1}: script "${relativePath}" is missing`);
      }
    }
  }
}

if (checked === 0) failures.push('No documented commands were found');

if (failures.length) {
  console.error('Documentation command validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation command validation passed (${checked} commands checked).`);
}
