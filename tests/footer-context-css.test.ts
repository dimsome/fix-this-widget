import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = () => readFileSync(join(process.cwd(), 'src/styles.css'), 'utf8');

function cssBlock(selector: string) {
  const source = styles();
  const start = source.indexOf(`${selector} {`);
  if (start === -1) return '';
  const blockStart = source.indexOf('{', start);
  const blockEnd = source.indexOf('}', blockStart);
  return source.slice(blockStart + 1, blockEnd);
}

describe('footer context CSS contract', () => {
  it('renders host-provided footer helper copy as quiet package-owned support text', () => {
    const footer = cssBlock('.fix-this-widget-footer-context');
    const paragraph = cssBlock('.fix-this-widget-footer-context p');
    const strong = cssBlock('.fix-this-widget-footer-context strong');
    const link = cssBlock('.fix-this-widget-footer-context a');

    expect(footer).toContain('color: var(--fix-this-widget-fg-3, #6C7680);');
    expect(footer).toContain('font-size: 11.5px;');
    expect(footer).toContain('line-height: 1.45;');
    expect(footer).toContain('font-weight: 400;');
    expect(paragraph).toContain('margin: 0;');
    expect(strong).toContain('color: inherit;');
    expect(strong).toContain('font-weight: var(--fix-this-widget-fw-semibold, 600);');
    expect(strong).not.toMatch(/font-size\s*:/);
    expect(link).toContain('color: inherit;');
    expect(link).toContain('font-size: inherit;');
  });
});
