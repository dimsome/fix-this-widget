import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const packageRoot = process.cwd();
const srcRoot = join(packageRoot, 'src');
const sourceExtensions = new Set(['.ts', '.tsx']);
const forbiddenRuntimeTerms = [
  'WTF_API_BASE_URL',
  '/api/feedback',
  'localStorage',
  'getAnonymousClientId',
  'postJson',
  'DATABASE_URL',
  'fullDom',
  'outerHTML',
  'innerHTML',
  'screenshot',
  'documentElement',
];

function extensionOf(pathname: string): string {
  const match = pathname.match(/\.[^.]+$/);
  return match ? match[0] : '';
}

function walk(pathname: string): string[] {
  const stats = statSync(pathname);
  if (stats.isDirectory()) {
    return readdirSync(pathname).flatMap((entry: string) => walk(join(pathname, entry)));
  }

  return stats.isFile() && sourceExtensions.has(extensionOf(pathname)) ? [pathname] : [];
}

function importSpecifiers(source: string): string[] {
  const specifiers: string[] = [];
  const staticImportPattern = /\bfrom\s+['"]([^'"]+)['"]/g;
  const sideEffectImportPattern = /\bimport\s+['"]([^'"]+)['"]/g;

  for (const match of source.matchAll(staticImportPattern)) {
    specifiers.push(match[1]);
  }
  for (const match of source.matchAll(sideEffectImportPattern)) {
    specifiers.push(match[1]);
  }

  return specifiers;
}

function isForbiddenImport(specifier: string): boolean {
  const normalized = specifier.replace(/\\/g, '/');
  const pathSegments = normalized.split('/').filter(Boolean);

  return normalized.includes('/apps/web/')
    || normalized.includes('/apps/api/')
    || normalized.includes('/app/api/')
    || normalized.startsWith('@wtf-is-this-tx/')
    || normalized.includes('wtfApiClient')
    || normalized === 'next'
    || normalized.startsWith('next/')
    || pathSegments.includes('db')
    || pathSegments.includes('drizzle')
    || pathSegments.includes('repository')
    || pathSegments.includes('repositories')
    || pathSegments.includes('persistence');
}

describe('fix-this-widget package boundary', () => {
  it('keeps package source decoupled from host app runtime concerns', () => {
    const violations: string[] = [];

    for (const file of walk(srcRoot)) {
      const relativeFile = relative(packageRoot, file);
      const source = readFileSync(file, 'utf8');

      for (const specifier of importSpecifiers(source)) {
        if (isForbiddenImport(specifier)) violations.push(`${relativeFile}: forbidden import ${specifier}`);
      }

      for (const term of forbiddenRuntimeTerms) {
        if (source.includes(term)) violations.push(`${relativeFile}: forbidden runtime term ${term}`);
      }
    }

    expect(violations).toEqual([]);
  });
});
