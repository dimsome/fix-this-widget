import { describe, expect, it } from 'vitest';

import { describeFeedbackElement } from '../src/elementMetadata';

describe('global feedback element metadata', () => {
  it('describes picked data-od elements without capturing DOM markup', () => {
    const button = document.createElement('button');
    button.setAttribute('data-od-id', 'hero-submit-button');
    button.setAttribute('data-wallet-state', 'connected');
    button.innerHTML = '<span>Analyze transaction</span>';

    const metadata = describeFeedbackElement(button);

    expect(metadata).toEqual({
      odId: 'hero-submit-button',
      label: 'Hero submit button',
      type: 'Button',
      selector: '[data-od-id="hero-submit-button"]',
      text: 'Analyze transaction',
    });
    expect(Object.keys(metadata).sort()).toEqual(['label', 'odId', 'selector', 'text', 'type']);
    expect(JSON.stringify(metadata)).not.toMatch(/outerHTML|innerHTML|<button|<span|walletState|data-wallet-state|screenshot|hiddenData|documentElement/i);
  });

  it('uses nearby landmarks and bounded text for generic picked elements', () => {
    const section = document.createElement('section');
    section.setAttribute('data-od-id', 'faq-panel');
    const copy = document.createElement('span');
    copy.textContent = 'This is a long body copy node that should stay readable but never dump unlimited page text into feedback metadata.';
    section.append(copy);
    document.body.append(section);

    expect(describeFeedbackElement(copy)).toMatchObject({
      odId: null,
      label: 'Span in Faq panel',
      type: 'Text',
      selector: 'section > span',
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
      odId: null,
      label: 'Pricing details',
      type: 'Card/Section',
      selector: '#pricing-card',
      text: 'Visible price copy with enough content to be useful to product maintainers.',
    });
    expect(Object.keys(metadata).sort()).toEqual(['label', 'odId', 'selector', 'text', 'type']);
    expect(JSON.stringify(metadata)).not.toMatch(/outerHTML|innerHTML|raw DOM|screenshot|walletState|hiddenData|data-private|className|style|dataset/i);
  });
});
