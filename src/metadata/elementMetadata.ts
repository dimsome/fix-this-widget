import type { FeedbackElementMetadata, FeedbackElementType } from '../shared/types';

const elementTypes = new Set<FeedbackElementType>(['Heading', 'Button', 'Link', 'Input', 'Card/Section', 'Image', 'Text']);
const stableSelectorAttributes = ['data-feedback-id', 'data-testid', 'data-test', 'data-cy', 'id', 'aria-label', 'name'];
const safeContextAttributes = new Set(['data-feedback-id', 'data-testid', 'data-test', 'data-cy', 'id', 'aria-label', 'role', 'name', 'type', 'href', 'alt', 'title']);
const maxContextLength = 300;

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

function escapeContextText(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const landmark = element.closest('section, article, aside, nav, header, footer, main, [data-feedback-id], [data-testid], [data-test], [data-cy]');
  if (!landmark || landmark === element) return null;

  for (const attribute of ['data-feedback-id', 'data-testid', 'data-test', 'data-cy', 'aria-label']) {
    const value = landmark.getAttribute(attribute);
    if (value) return prettify(value);
  }

  return landmark.tagName ? capitalize(landmark.tagName.toLowerCase()) : null;
}

function labelFor(element: Element): string {
  for (const attribute of ['data-feedback-id', 'data-testid', 'data-test', 'data-cy']) {
    const value = element.getAttribute(attribute);
    if (value) return prettify(value);
  }

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

function pathSelectorFor(element: Element): string {
  const parts: string[] = [];
  let node: Element | null = element;

  while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {
    const current: Element = node;
    const hasStableAttribute = stableSelectorAttributes.some((attribute) => selectorCandidateForAttribute(current, attribute));
    if (current.parentElement === document.body && !hasStableAttribute && parts.length > 0) break;

    let segment = current.tagName.toLowerCase();
    const position = sameTagPosition(current);
    if (position) {
      segment += `:nth-of-type(${position})`;
    }

    parts.unshift(segment);
    node = current.parentElement;
  }

  return parts.join(' > ');
}

function selectorCandidateForAttribute(element: Element, attribute: string): string | null {
  const value = attribute === 'id' ? element.id : element.getAttribute(attribute);
  if (!value) return null;

  if (attribute === 'id') return `#${selectorValue(value)}`;
  return `[${attribute}="${selectorValue(value)}"]`;
}

function selectorCandidatesFor(element: Element): string[] {
  const candidates = stableSelectorAttributes
    .map((attribute) => selectorCandidateForAttribute(element, attribute))
    .filter((candidate): candidate is string => Boolean(candidate));

  candidates.push(pathSelectorFor(element));
  return [...new Set(candidates)];
}

function safeAttributeMarkup(element: Element): string {
  const attributes: string[] = [];

  for (const attribute of Array.from(element.attributes)) {
    if (!safeContextAttributes.has(attribute.name)) continue;
    if (!attribute.value) continue;
    attributes.push(`${attribute.name}="${escapeContextText(truncate(attribute.value, 80))}"`);
  }

  return attributes.length ? ` ${attributes.join(' ')}` : '';
}

function contextSnippetFor(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const attributes = safeAttributeMarkup(element);
  const text = escapeContextText(truncate(element.textContent, 180));
  const snippet = `<${tag}${attributes}>${text}</${tag}>`;
  return truncate(snippet, maxContextLength);
}

function parentContextFor(element: Element): string | null {
  const parent = element.parentElement;
  if (!parent || parent === document.body) return null;

  const tag = parent.tagName.toLowerCase();
  const hasStableAttribute = stableSelectorAttributes.some((attribute) => selectorCandidateForAttribute(parent, attribute));
  const isLandmark = ['section', 'article', 'aside', 'form', 'nav', 'header', 'footer', 'main'].includes(tag);

  return hasStableAttribute || isLandmark ? contextSnippetFor(parent) : null;
}

function boundsFor(element: Element): FeedbackElementMetadata['bounds'] {
  const rect = element.getBoundingClientRect();
  return {
    top: Math.round(rect.top),
    left: Math.round(rect.left),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

export function describeFeedbackElement(element: Element): FeedbackElementMetadata {
  const type = elementTypeFor(element);
  const safeType = elementTypes.has(type) ? type : 'Text';
  const text = truncate(element.textContent);
  const selectorCandidates = selectorCandidatesFor(element);

  return {
    label: labelFor(element),
    type: safeType,
    selector: selectorCandidates[0],
    selectorCandidates,
    bounds: boundsFor(element),
    text: text || null,
    context: {
      path: pathSelectorFor(element),
      target: contextSnippetFor(element),
      parent: parentContextFor(element),
    },
  };
}
