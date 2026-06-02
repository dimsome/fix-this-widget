import type { CSSProperties } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useFixThisWidgetFooterStyle } from '../src/useFixThisWidgetFooterStyle';

function setViewport(height: number): void {
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

function makeRect(top: number, height: number): DOMRect {
  return {
    x: 0,
    y: top,
    top,
    left: 0,
    bottom: top + height,
    right: 1280,
    width: 1280,
    height,
    toJSON: () => ({}),
  } as DOMRect;
}

function FooterOffsetHarness({ selector }: { selector: string }) {
  const style = useFixThisWidgetFooterStyle(selector) as CSSProperties | undefined;
  return <div data-testid="feedback-root" style={style} />;
}

describe('fix-this-widget footer avoidance', () => {
  it('sets a CSS footer offset only while the site footer overlaps the viewport', () => {
    setViewport(720);
    render(
      <>
        <footer data-testid="site-footer" data-od-id="site-footer" />
        <FooterOffsetHarness selector={'[data-od-id="site-footer"]'} />
      </>,
    );

    const footer = screen.getByTestId('site-footer');
    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue(makeRect(660, 120));

    fireEvent.scroll(window);

    expect(screen.getByTestId('feedback-root')).toHaveStyle({
      '--fix-this-widget-footer-offset': '60px',
    });

    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue(makeRect(760, 120));
    fireEvent.scroll(window);

    expect(screen.getByTestId('feedback-root').getAttribute('style')).toBe('');
  });
});
