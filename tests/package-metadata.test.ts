import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type PackageJson = {
  name?: string;
  private?: boolean;
  description?: string;
  license?: string;
  repository?: { type?: string; url?: string };
  homepage?: string;
  bugs?: { url?: string };
  keywords?: string[];
  publishConfig?: { access?: string };
  scripts?: Record<string, string>;
  exports?: Record<string, unknown>;
  main?: string;
  module?: string;
  types?: string;
  peerDependencies?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  engines?: Record<string, string>;
  files?: string[];
};

function readPackageJson(): PackageJson {
  return JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as PackageJson;
}

describe('package metadata', () => {
  it('declares unscoped public package metadata without a publish script', () => {
    const pkg = readPackageJson();

    expect(pkg.name).toBe('fix-this-widget');
    expect(pkg.private).not.toBe(true);
    expect(pkg.description).toMatch(/Standalone React feedback widget/);
    expect(pkg.license).toBe('MIT');
    expect(pkg.publishConfig).toBeUndefined();
    expect(pkg.repository).toEqual({
      type: 'git',
      url: 'git+https://github.com/dimsome/fix-this-widget.git',
    });
    expect(pkg.homepage).toBe('https://github.com/dimsome/fix-this-widget#readme');
    expect(pkg.bugs).toEqual({ url: 'https://github.com/dimsome/fix-this-widget/issues' });
    expect(pkg.keywords).toEqual(expect.arrayContaining(['react', 'feedback', 'widget', 'fix-request', 'element-picker']));
    expect(pkg.scripts?.publish).toBeUndefined();
  });

  it('exports built ESM, declarations, CSS, element metadata, and server JSONL helpers instead of raw TS', () => {
    const pkg = readPackageJson();

    expect(pkg.main).toBe('./dist/index.js');
    expect(pkg.module).toBe('./dist/index.js');
    expect(pkg.types).toBe('./dist/index.d.ts');
    expect(pkg.exports?.['.']).toEqual({
      types: './dist/index.d.ts',
      import: './dist/index.js',
    });
    expect(pkg.exports?.['./styles.css']).toEqual({
      types: './dist/styles.css.d.ts',
      default: './dist/styles.css',
    });
    expect(pkg.exports?.['./element-metadata']).toEqual({
      types: './dist/metadata/elementMetadata.d.ts',
      import: './dist/metadata/elementMetadata.js',
    });
    expect(pkg.exports?.['./server']).toEqual({
      types: './dist/server.d.ts',
      import: './dist/server.js',
    });
    expect(pkg.scripts?.build).toContain('tsup');
    expect(pkg.scripts?.build).not.toContain('tsc --noEmit');
    expect(pkg.scripts?.['consumer-smoke']).toBe('node scripts/package-consumer-smoke.mjs');
    expect(pkg.scripts?.check).toContain('npm run consumer-smoke');
    expect(pkg.scripts?.prepublishOnly).toBe('npm run check');
    expect(pkg.files).toEqual(['dist', 'README.md', 'docs/assets/example-closed.png']);
  });

  it('supports React 18 through React 20 peers, declares the server runtime, and no private host-app dependency', () => {
    const pkg = readPackageJson();
    const dependencyNames = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ];

    expect(pkg.peerDependencies?.react).toBe('>=18.2.0 <21.0.0');
    expect(pkg.peerDependencies?.['react-dom']).toBe('>=18.2.0 <21.0.0');
    expect(pkg.engines?.node).toBe('>=18.0.0');
    expect(dependencyNames.filter((name) => name.startsWith('@wtf-is-this-tx/'))).toEqual([]);
  });

  it('keeps examples in the release gate so consumer demos do not drift', () => {
    const pkg = readPackageJson();

    expect(pkg.scripts?.['examples:check']).toContain('examples/example-simple');
    expect(pkg.scripts?.['examples:check']).toContain('examples/example-full');
    expect(pkg.scripts?.['examples:audit']).toContain('audit --audit-level=high');
    expect(pkg.scripts?.check).toContain('npm run examples:check');
    expect(pkg.scripts?.check).toContain('npm run examples:audit');
  });
});
