import type { FeedbackElementMetadata, FeedbackElementType } from './types';

const elementTypes = new Set<FeedbackElementType>(['Heading', 'Button', 'Link', 'Input', 'Card/Section', 'Image', 'Text']);

function prettify(value: string): string {
  const words = value.replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : value;
}

function truncate(value: string | null | undefined, length = 80): string {
  const normalized = (value ?? '').replace(/\s+/g, ' ').trim();
  return normalized.length > length ? `${normalized.slice(0, length - 1)}…` : normalized;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function selectorValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function elementTypeFor(element: Element): FeedbackElementType {
  const tag = element.tagName.toLowerCase();
  const role = element.getAttribute('role');

  if (/^h[1-6]$/.test(tag) || role === 'heading') return 'Heading';
  if (tag === 'button' || role === 'button') return 'Button';
  if (tag === 'a' || role === 'link') return 'Link';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'Input';
  if (tag === 'img' || tag === 'svg') return 'Image';
  if (['section', 'article', 'aside', 'form', 'nav', 'header', 'footer', 'main'].includes(tag)) return 'Card/Section';

  const className = typeof element.className === 'string' ? element.className : '';
  if (/card|section|panel|shell/i.test(className)) return 'Card/Section';

  return 'Text';
}

function landmarkLabel(element: Element): string | null {
  const landmark = element.closest('section, article, aside, nav, header, footer, main, [data-od-id]');
  if (!landmark || landmark === element) return null;

  const odId = landmark.getAttribute('data-od-id');
  if (odId) return prettify(odId);

  return landmark.tagName ? capitalize(landmark.tagName.toLowerCase()) : null;
}

function labelFor(element: Element): string {
  const odId = element.getAttribute('data-od-id');
  if (odId) return prettify(odId);

  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return truncate(ariaLabel, 40);

  const tag = element.tagName.toLowerCase();
  if (/^h[1-6]$/.test(tag) || tag === 'button' || tag === 'a' || tag === 'summary') {
    const text = truncate(element.textContent, 40);
    if (text) return text;
  }

  const landmark = landmarkLabel(element);
  return landmark ? `${capitalize(tag)} in ${landmark}` : capitalize(tag);
}

function sameTagPosition(element: Element): number | null {
  const parent = element.parentElement;
  if (!parent) return null;

  let sameTagCount = 0;
  let position = 0;
  for (const child of parent.children) {
    if (child.tagName !== element.tagName) continue;
    sameTagCount += 1;
    if (child === element) position = sameTagCount;
  }

  return sameTagCount > 1 ? position : null;
}

function selectorFor(element: Element): string {
  const odId = element.getAttribute('data-od-id');
  if (odId) return `[data-od-id="${selectorValue(odId)}"]`;

  if (element.id) return `#${selectorValue(element.id)}`;

  const parts: string[] = [];
  let node: Element | null = element;

  while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {
    let segment = node.tagName.toLowerCase();
    const position = sameTagPosition(node);
    if (position) {
      segment += `:nth-of-type(${position})`;
    }

    parts.unshift(segment);
    node = node.parentElement;
  }

  return parts.join(' > ');
}

export function describeFeedbackElement(element: Element): FeedbackElementMetadata {
  const type = elementTypeFor(element);
  const safeType = elementTypes.has(type) ? type : 'Text';
  const text = truncate(element.textContent);

  return {
    odId: element.getAttribute('data-od-id'),
    label: labelFor(element),
    type: safeType,
    selector: selectorFor(element),
    text: text || null,
  };
}
