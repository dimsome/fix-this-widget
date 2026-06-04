import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { FixThisWidgetFeedbackPayload } from '../shared/types';

export interface FixThisWidgetJsonlOptions {
  filePath?: string;
}

export type FixThisWidgetRequestHandler = (request: Request) => Promise<Response>;

const defaultFeedbackFilePath = 'feedback/fix-this-widget.jsonl';

function resolveFeedbackFilePath(filePath = defaultFeedbackFilePath): string {
  return resolve(process.cwd(), filePath);
}

export async function appendFeedbackToJsonl(
  payload: FixThisWidgetFeedbackPayload,
  options: FixThisWidgetJsonlOptions = {},
): Promise<void> {
  const filePath = resolveFeedbackFilePath(options.filePath);
  await mkdir(dirname(filePath), { recursive: true });
  await appendFile(filePath, `${JSON.stringify(payload)}\n`, 'utf8');
}

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isFeedbackPayload(value: unknown): value is FixThisWidgetFeedbackPayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<FixThisWidgetFeedbackPayload>;
  return typeof candidate.source === 'string'
    && typeof candidate.note === 'string'
    && candidate.note.trim().length > 0
    && typeof candidate.ts === 'string'
    && typeof candidate.page?.url === 'string'
    && typeof candidate.page.title === 'string'
    && typeof candidate.viewport?.w === 'number'
    && typeof candidate.viewport.h === 'number';
}

export function createFixThisWidgetHandler(options: FixThisWidgetJsonlOptions = {}): FixThisWidgetRequestHandler {
  return async function handleFixThisWidgetFeedback(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: 'invalid_json' });
    }

    if (!isFeedbackPayload(body)) return json(400, { error: 'invalid_feedback_payload' });

    await appendFeedbackToJsonl(body, options);
    return new Response(null, { status: 204 });
  };
}
