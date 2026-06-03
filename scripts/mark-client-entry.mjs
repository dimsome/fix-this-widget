import { readFile, writeFile } from 'node:fs/promises';

const entryPath = new URL('../dist/index.js', import.meta.url);
const source = await readFile(entryPath, 'utf8');
const directive = '"use client";\n';

if (!source.startsWith(directive)) {
  await writeFile(entryPath, `${directive}${source}`);
}
