import { appendFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type { FeedbackElementMetadata, FeedbackElementType, FixThisWidgetFeedbackPayload } from '../shared/types';

export interface FixThisWidgetJsonlOptions {
  filePath?: string;
}

export type FixThisWidgetRequestHandler = (request: Request) => Promise<Response>;

const defaultFeedbackFilePath = 'feedback/fix-this-widget.jsonl';
const elementTypes = new Set<FeedbackElementType>(['Heading', 'Button', 'Link', 'Input', 'Card/Section', 'Image', 'Text']);
const safeContextAttributes = new Set(['data-feedback-id', 'data-testid', 'data-test', 'data-cy', 'id', 'aria-label', 'role', 'name', 'type', 'href', 'alt', 'title']);

const limits = {
  source: 120,
  note: 5000,
  email: 320,
  pageUrl: 2048,
  pageTitle: 300,
  timestamp: 80,
  requestId: 160,
  sessionId: 160,
  elementLabel: 120,
  elementSelector: 300,
  elementText: 120,
  contextSnippet: 300,
  contextPath: 300,
};

function resolveFeedbackFilePath(filePath = defaultFeedbackFilePath): string {
  return resolve(process.cwd(), filePath);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizedString(value: unknown, maxLength: number, { allowEmpty = false } = {}): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (!allowEmpty && normalized.length === 0) return null;
  if (normalized.length > maxLength) return null;
  return normalized;
}

function optionalString(value: unknown, maxLength: number): string | null | undefined {
  if (value === undefined || value === null) return undefined;
  const normalized = normalizedString(value, maxLength, { allowEmpty: true });
  if (normalized === null) return null;
  return normalized.length > 0 ? normalized : undefined;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function roundedNumber(value: unknown, { minimum }: { minimum?: number } = {}): number | null {
  const number = finiteNumber(value);
  if (number === null) return null;
  const rounded = Math.round(number);
  return minimum === undefined ? rounded : Math.max(minimum, rounded);
}

function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function stripQueryAndHashFromHref(value: string): string {
  const trimmed = value.trim();
  try {
    const baseUrl = 'https://fix-this-widget.local';
    const parsed = new URL(trimmed, baseUrl);
    if (/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)) return `${parsed.origin}${parsed.pathname}`;
    if (trimmed.startsWith('/')) return parsed.pathname;
    return parsed.pathname.replace(/^\//, '') || trimmed.split(/[?#]/, 1)[0];
  } catch {
    return trimmed.split(/[?#]/, 1)[0];
  }
}

function sanitizeContextSnippet(value: unknown): string | null {
  const snippet = normalizedString(value, limits.contextSnippet);
  if (!snippet) return null;

  return snippet.replace(
    /\s+([A-Za-z_:][\w:.-]*)=(['"])(.*?)\2/g,
    (_match, rawAttribute: string, _quote: string, rawValue: string) => {
      const attribute = rawAttribute.toLowerCase();
      if (!safeContextAttributes.has(attribute)) return '';

      const value = attribute === 'href'
        ? stripQueryAndHashFromHref(rawValue)
        : rawValue.replace(/\s+/g, ' ').trim();
      if (!value) return '';

      return ` ${attribute}="${escapeAttribute(value.slice(0, 80))}"`;
    },
  );
}

function isClassSelector(selector: string): boolean {
  return /(^|[\s>+~])\.[A-Za-z_-]/.test(selector);
}

function sanitizedSelector(value: unknown): string | null {
  const selector = normalizedString(value, limits.elementSelector);
  if (!selector) return null;
  if (isClassSelector(selector)) return null;
  return selector;
}

function normalizeSelectorCandidates(value: unknown, fallbackSelector: unknown): string[] | null {
  const rawCandidates = Array.isArray(value) ? value : [];
  const candidates = rawCandidates
    .map((candidate) => sanitizedSelector(candidate))
    .filter((candidate): candidate is string => Boolean(candidate));

  const fallback = sanitizedSelector(fallbackSelector);
  if (fallback) candidates.unshift(fallback);

  const uniqueCandidates = [...new Set(candidates)].slice(0, 8);
  return uniqueCandidates.length > 0 ? uniqueCandidates : null;
}

function normalizeBounds(value: unknown): FeedbackElementMetadata['bounds'] | null {
  if (!isRecord(value)) return null;
  const top = roundedNumber(value.top);
  const left = roundedNumber(value.left);
  const width = roundedNumber(value.width, { minimum: 0 });
  const height = roundedNumber(value.height, { minimum: 0 });
  if (top === null || left === null || width === null || height === null) return null;
  return { top, left, width, height };
}

function normalizeElementContext(value: unknown): FeedbackElementMetadata['context'] | null {
  if (!isRecord(value)) return null;
  const path = normalizedString(value.path, limits.contextPath);
  const target = sanitizeContextSnippet(value.target);
  const parent = value.parent === null || value.parent === undefined ? null : sanitizeContextSnippet(value.parent);
  if (!path || !target || parent === undefined) return null;
  return { path, target, parent };
}

function normalizeFeedbackElement(value: unknown): FeedbackElementMetadata | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value)) return null;

  const label = normalizedString(value.label, limits.elementLabel);
  const type = typeof value.type === 'string' && elementTypes.has(value.type as FeedbackElementType)
    ? value.type as FeedbackElementType
    : null;
  const selectorCandidates = normalizeSelectorCandidates(value.selectorCandidates, value.selector);
  const selector = sanitizedSelector(value.selector) ?? selectorCandidates?.[0] ?? null;
  const bounds = normalizeBounds(value.bounds);
  const text = value.text === null || value.text === undefined ? null : normalizedString(value.text, limits.elementText, { allowEmpty: true });
  const context = normalizeElementContext(value.context);

  if (!label || !type || !selector || !selectorCandidates || !bounds || text === undefined || !context) return null;

  return {
    label,
    type,
    selector,
    selectorCandidates,
    bounds,
    text: text && text.length > 0 ? text : null,
    context,
  };
}

function normalizeFeedbackPayload(value: unknown): FixThisWidgetFeedbackPayload | null {
  if (!isRecord(value)) return null;

  const source = normalizedString(value.source, limits.source);
  const note = normalizedString(value.note, limits.note);
  const ts = normalizedString(value.ts, limits.timestamp);
  const page = isRecord(value.page)
    ? {
        url: normalizedString(value.page.url, limits.pageUrl),
        title: normalizedString(value.page.title, limits.pageTitle, { allowEmpty: true }),
      }
    : null;
  const viewport = isRecord(value.viewport)
    ? {
        w: roundedNumber(value.viewport.w, { minimum: 0 }),
        h: roundedNumber(value.viewport.h, { minimum: 0 }),
      }
    : null;
  const scroll = isRecord(value.scroll)
    ? {
        x: roundedNumber(value.scroll.x),
        y: roundedNumber(value.scroll.y),
      }
    : null;
  const email = optionalString(value.email, limits.email);
  const requestId = optionalString(value.requestId, limits.requestId);
  const sessionId = optionalString(value.sessionId, limits.sessionId);
  const element = normalizeFeedbackElement(value.element);

  if (!page || !viewport || !scroll) return null;

  if (
    !source
    || !note
    || !ts
    || !page.url
    || page.title === null
    || viewport.w === null
    || viewport.h === null
    || scroll.x === null
    || scroll.y === null
    || email === null
    || requestId === null
    || sessionId === null
    || (value.element !== undefined && value.element !== null && !element)
  ) {
    return null;
  }

  return {
    source,
    note,
    ...(email ? { email } : {}),
    element,
    page: { url: page.url, title: page.title ?? '' },
    viewport: { w: viewport.w, h: viewport.h },
    scroll: { x: scroll.x, y: scroll.y },
    ts,
    ...(requestId ? { requestId } : {}),
    ...(sessionId ? { sessionId } : {}),
  };
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

export function createFixThisWidgetHandler(options: FixThisWidgetJsonlOptions = {}): FixThisWidgetRequestHandler {
  return async function handleFixThisWidgetFeedback(request: Request): Promise<Response> {
    if (request.method !== 'POST') return json(405, { error: 'method_not_allowed' });

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(400, { error: 'invalid_json' });
    }

    const feedbackPayload = normalizeFeedbackPayload(body);
    if (!feedbackPayload) return json(400, { error: 'invalid_feedback_payload' });

    await appendFeedbackToJsonl(feedbackPayload, options);
    return new Response(null, { status: 204 });
  };
}
