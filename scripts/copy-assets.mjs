import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const assets = [
  ['src/styles.css', 'dist/styles.css'],
];

await Promise.all(assets.map(async ([from, to]) => {
  await mkdir(dirname(to), { recursive: true });
  await copyFile(join(process.cwd(), from), join(process.cwd(), to));
}));
