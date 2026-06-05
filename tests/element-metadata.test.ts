import { describe, expect, it } from 'vitest';

import { describeFeedbackElement } from '../src/metadata/elementMetadata';

describe('fix-this-widget element metadata', () => {
  it('prefers public stable selector attributes and bounded sanitized context', () => {
    const button = document.createElement('button');
    button.setAttribute('data-feedback-id', 'hero-primary-cta');
    button.setAttribute('data-testid', 'hero-testid');
    button.setAttribute('data-wallet-state', 'connected');
    button.innerHTML = '<span>Analyze transaction</span>';
    button.getBoundingClientRect = () => ({
      x: 20,
      y: 10,
      top: 10,
      left: 20,
      right: 140,
      bottom: 50,
      width: 120,
      height: 40,
      toJSON: () => ({}),
    } as DOMRect);

    const metadata = describeFeedbackElement(button);

    expect(metadata).toEqual({
      label: 'Hero primary cta',
      type: 'Button',
      selector: '[data-feedback-id="hero-primary-cta"]',
      selectorCandidates: [
        '[data-feedback-id="hero-primary-cta"]',
        '[data-testid="hero-testid"]',
        'button',
      ],
      bounds: { top: 10, left: 20, width: 120, height: 40 },
      text: 'Analyze transaction',
      context: {
        path: 'button',
        target: '<button data-feedback-id="hero-primary-cta" data-testid="hero-testid">Analyze transaction</button>',
        parent: null,
      },
    });
    expect(JSON.stringify(metadata)).not.toMatch(/outerHTML|innerHTML|<span|walletState|data-wallet-state|screenshot|hiddenData|documentElement/i);
  });

  it('uses nearby landmarks and bounded text for generic picked elements', () => {
    const section = document.createElement('section');
    section.setAttribute('data-feedback-id', 'faq-panel');
    const copy = document.createElement('span');
    copy.textContent = 'This is a long body copy node that should stay readable but never dump unlimited page text into feedback metadata.';
    section.append(copy);
    document.body.append(section);

    expect(describeFeedbackElement(copy)).toMatchObject({
      label: 'Span in Faq panel',
      type: 'Text',
      selector: 'section > span',
      selectorCandidates: ['section > span'],
      context: {
        path: 'section > span',
        parent: '<section data-feedback-id="faq-panel">This is a long body copy node that should stay readable but never dump unlimited page text into feedback metadata.</section>',
      },
    });
    const text = describeFeedbackElement(copy).text;
    expect(text).toMatch(/^This is a long body copy node/);
    expect(text?.endsWith('…')).toBe(true);
    expect(text?.length).toBeLessThanOrEqual(80);
  });

  it('emits only the safe bounded metadata contract for rich DOM nodes', () => {
    const card = document.createElement('article');
    card.id = 'pricing-card';
    card.className = 'secret-wallet-state-card';
    card.setAttribute('aria-label', 'Pricing details');
    card.setAttribute('data-private-hidden-data', 'do-not-copy');
    card.textContent = 'Visible price copy with enough content to be useful to product maintainers.';

    const metadata = describeFeedbackElement(card);

    expect(metadata).toEqual({
      label: 'Pricing details',
      type: 'Card/Section',
      selector: '#pricing-card',
      selectorCandidates: ['#pricing-card', '[aria-label="Pricing details"]', 'article'],
      bounds: { top: 0, left: 0, width: 0, height: 0 },
      text: 'Visible price copy with enough content to be useful to product maintainers.',
      context: {
        path: 'article',
        target: '<article id="pricing-card" aria-label="Pricing details">Visible price copy with enough content to be useful to product maintainers.</article>',
        parent: null,
      },
    });
    expect(JSON.stringify(metadata)).not.toMatch(/outerHTML|innerHTML|raw DOM|screenshot|walletState|hiddenData|data-private|className|style|dataset|secret-wallet-state-card/i);
  });

  it('uses attribute selectors for arbitrary host ids and redacts tokenized href context', () => {
    const link = document.createElement('a');
    link.id = 'checkout:primary.cta';
    link.href = 'https://example.test/reset?token=secret#hash';
    link.className = 'private-reset-link';
    link.setAttribute('data-private-token', 'secret');
    link.textContent = 'Reset password';

    const metadata = describeFeedbackElement(link);

    expect(metadata).toMatchObject({
      label: 'Reset password',
      type: 'Link',
      selector: '[id="checkout:primary.cta"]',
      selectorCandidates: ['[id="checkout:primary.cta"]', 'a'],
      context: {
        path: 'a',
        target: '<a id="checkout:primary.cta" href="https://example.test/reset">Reset password</a>',
      },
    });
    expect(JSON.stringify(metadata)).not.toMatch(/token=secret|#hash|data-private-token|private-reset-link|class=/i);
  });
});
