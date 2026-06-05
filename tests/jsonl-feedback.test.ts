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

  it('rejects unsupported methods, malformed JSON, and empty feedback notes', async () => {
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
  });
});
