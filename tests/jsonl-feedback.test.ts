import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { appendFeedbackToJsonl, createFixThisWidgetHandler } from '../src/server/jsonlFeedback';
import type { FixThisWidgetFeedbackPayload } from '../src';

function payload(note = 'The CTA is unclear.'): FixThisWidgetFeedbackPayload {
  return {
    source: 'fix_this_widget',
    note,
    element: null,
    page: { url: 'https://example.test/pricing', title: 'Pricing' },
    viewport: { w: 1280, h: 720 },
    scroll: { x: 0, y: 320 },
    ts: '2026-06-03T00:00:00.000Z',
  };
}

describe('default JSONL feedback storage', () => {
  it('appends feedback payloads as newline-delimited JSON', async () => {
    const filePath = join(mkdtempSync(join(tmpdir(), 'fix-this-widget-')), 'feedback.jsonl');

    await appendFeedbackToJsonl(payload('First'), { filePath });
    await appendFeedbackToJsonl(payload('Second'), { filePath });

    const lines = readFileSync(filePath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    expect(lines).toEqual([
      expect.objectContaining({ note: 'First', source: 'fix_this_widget' }),
      expect.objectContaining({ note: 'Second', source: 'fix_this_widget' }),
    ]);
  });

  it('creates a zero-config POST handler that writes to feedback.jsonl by default', async () => {
    const filePath = join(mkdtempSync(join(tmpdir(), 'fix-this-widget-')), 'feedback.jsonl');
    const handler = createFixThisWidgetHandler({ filePath });

    const response = await handler(new Request('https://example.test/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload()),
    }));

    expect(response.status).toBe(204);
    expect(readFileSync(filePath, 'utf8')).toContain('"note":"The CTA is unclear."');
  });

  it('normalizes direct POST payloads before writing to JSONL', async () => {
    const filePath = join(mkdtempSync(join(tmpdir(), 'fix-this-widget-')), 'feedback.jsonl');
    const handler = createFixThisWidgetHandler({ filePath });
    const directPostPayload = {
      ...payload('  Persist only the safe contract.  '),
      email: '  user@example.test  ',
      clientId: 'should-not-persist',
      screenshot: 'data:image/png;base64,secret',
      element: {
        label: '  Checkout link  ',
        type: 'Link',
        selector: '[data-feedback-id="checkout-link"]',
        selectorCandidates: ['[data-feedback-id="checkout-link"]', '.private-class'],
        bounds: { top: 10.2, left: 20.8, width: 120.4, height: 40.1 },
        text: '  Checkout now  ',
        context: {
          path: 'main > a',
          target: '<a data-feedback-id="checkout-link" data-private-token="secret" class="private" href="https://example.test/reset?token=secret#hash">Checkout now</a>',
          parent: '<main data-testid="checkout-area" style="color:red">Checkout now</main>',
          outerHTML: '<html>secret</html>',
        },
        privateDataset: { token: 'secret' },
      },
    };

    const response = await handler(new Request('https://example.test/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directPostPayload),
    }));

    expect(response.status).toBe(204);
    const [stored] = readFileSync(filePath, 'utf8').trim().split('\n').map((line) => JSON.parse(line));
    expect(stored).toMatchObject({
      source: 'fix_this_widget',
      note: 'Persist only the safe contract.',
      email: 'user@example.test',
      element: {
        label: 'Checkout link',
        type: 'Link',
        selector: '[data-feedback-id="checkout-link"]',
        selectorCandidates: ['[data-feedback-id="checkout-link"]'],
        bounds: { top: 10, left: 21, width: 120, height: 40 },
        text: 'Checkout now',
        context: {
          path: 'main > a',
          target: '<a data-feedback-id="checkout-link" href="https://example.test/reset">Checkout now</a>',
          parent: '<main data-testid="checkout-area">Checkout now</main>',
        },
      },
    });
    expect(JSON.stringify(stored)).not.toMatch(/clientId|screenshot|privateDataset|outerHTML|data-private-token|private-class|class=|style=|token=secret|#hash/i);
  });

  it('rejects unsupported methods, malformed JSON, empty notes, and oversized fields', async () => {
    const handler = createFixThisWidgetHandler({ filePath: join(mkdtempSync(join(tmpdir(), 'fix-this-widget-')), 'feedback.jsonl') });

    await expect(handler(new Request('https://example.test/api/fix-this-widget/feedback', { method: 'GET' })))
      .resolves.toMatchObject({ status: 405 });

    await expect(handler(new Request('https://example.test/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{not-json',
    }))).resolves.toMatchObject({ status: 400 });

    await expect(handler(new Request('https://example.test/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload('   ')),
    }))).resolves.toMatchObject({ status: 400 });

    await expect(handler(new Request('https://example.test/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload('x'.repeat(5001))),
    }))).resolves.toMatchObject({ status: 400 });
  });
});
