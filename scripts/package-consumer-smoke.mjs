import { mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chdir } from 'node:process';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const workspace = await mkdtemp(join(tmpdir(), 'fix-this-widget-consumer-'));
let tarballPath;

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd ?? repoRoot,
    stdio: options.stdio ?? 'inherit',
    encoding: 'utf8',
  });
}

try {
  const packOutput = execFileSync('npm', ['pack', '--json'], { cwd: repoRoot, encoding: 'utf8' });
  const [{ filename }] = JSON.parse(packOutput);
  tarballPath = join(repoRoot, filename);

  await writeFile(join(workspace, 'package.json'), JSON.stringify({ type: 'module', private: true }, null, 2));
  await writeFile(join(workspace, 'tsconfig.json'), JSON.stringify({
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      moduleResolution: 'Bundler',
      jsx: 'react-jsx',
      strict: true,
      skipLibCheck: false,
    },
    include: ['src'],
  }, null, 2));
  await writeFile(join(workspace, 'src-app.tsx'), `
import { FixThisWidget, type FixThisWidgetFeedbackPayload } from 'fix-this-widget';
import 'fix-this-widget/styles.css';
import { describeFeedbackElement } from 'fix-this-widget/element-metadata';

const submitFeedback = async (payload: FixThisWidgetFeedbackPayload) => {
  if (!payload.page.url) throw new Error('missing page URL');
};

describeFeedbackElement(document.createElement('button'));
export const App = () => <FixThisWidget submitFeedback={submitFeedback} collectEmail={false} />;
`);
  await writeFile(join(workspace, 'import-smoke.mjs'), `
import { FixThisWidget } from 'fix-this-widget';
import { createFixThisWidgetHandler } from 'fix-this-widget/server';
import { describeFeedbackElement } from 'fix-this-widget/element-metadata';

if (typeof FixThisWidget !== 'function') throw new Error('FixThisWidget export missing');
if (typeof createFixThisWidgetHandler !== 'function') throw new Error('server export missing');
if (typeof describeFeedbackElement !== 'function') throw new Error('metadata export missing');
`);

  run('npm', ['install', tarballPath, 'react@18.2.0', 'react-dom@18.2.0', '@types/react@18.2.79', '@types/react-dom@18.2.25', 'typescript@5.6.3'], { cwd: workspace });
  await mkdir(join(workspace, 'src'));
  await rename(join(workspace, 'src-app.tsx'), join(workspace, 'src/app.tsx'));
  run('npx', ['tsc', '-p', 'tsconfig.json', '--noEmit'], { cwd: workspace });
  run('node', ['import-smoke.mjs'], { cwd: workspace });
  console.log(`consumer smoke passed in ${workspace}`);
} finally {
  chdir(repoRoot);
  if (tarballPath) await rm(tarballPath, { force: true });
  await rm(workspace, { recursive: true, force: true });
}
