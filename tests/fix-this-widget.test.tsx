import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as widgetPackage from '../src';
import { FixThisWidget } from '../src';
import type { FixThisWidgetFeedbackResponse, SubmitFixThisWidgetFeedback } from '../src';

function feedbackResponse(note = 'Saved'): FixThisWidgetFeedbackResponse {
  return { kind: 'feedback', feedbackId: 'feedback_1', created: true, rating: null, note };
}

function makeSubmitFeedback(response: FixThisWidgetFeedbackResponse = feedbackResponse()) {
  return vi.fn<SubmitFixThisWidgetFeedback>().mockResolvedValue(response);
}

function submittedBodies(submitFeedback: ReturnType<typeof makeSubmitFeedback>): Record<string, unknown>[] {
  return submitFeedback.mock.calls.map(([body]) => body as unknown as Record<string, unknown>);
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
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

describe('fix-this-widget package', () => {
  beforeEach(() => {
    document.title = 'Landing | WTF is this tx?';
    window.history.pushState({}, '', '/?from=test');
    setViewport(1280, 720);
  });

  it('exports FixThisWidget without legacy GlobalFeedback aliases', () => {
    expect(widgetPackage.FixThisWidget).toBe(FixThisWidget);
    expect(widgetPackage).not.toHaveProperty('GlobalFeedbackWidget');
  });

  it('raises the floating feedback control above the default footer selector when the footer enters the viewport', () => {
    render(
      <>
        <footer data-testid="site-footer" data-od-id="site-footer" />
        <FixThisWidget submitFeedback={makeSubmitFeedback()} />
      </>,
    );

    const footer = screen.getByTestId('site-footer');
    vi.spyOn(footer, 'getBoundingClientRect').mockReturnValue(makeRect(660, 120));

    fireEvent.scroll(window);

    expect(document.querySelector('[data-fix-this-widget]')).toHaveStyle({
      '--fix-this-widget-footer-offset': '60px',
    });
  });

  it('opens the form, validates an empty note inline, and keeps Send feedback clickable', () => {
    const submitFeedback = makeSubmitFeedback();

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));

    const dialog = screen.getByRole('dialog', { name: /^Send feedback$/i });
    const sendButton = within(dialog).getByRole('button', { name: /^Send feedback$/i });
    expect(sendButton).not.toBeDisabled();

    const caveat = screen.getByTestId('fix-this-widget-form-caveat');
    expect(caveat.querySelector('strong')).toHaveTextContent('We read every note.');
    expect(caveat.querySelector('br')).toBeInTheDocument();
    expect(caveat).toHaveTextContent('Useful feedback can trigger agents to fix or improve this app.');
    expect(caveat).toHaveTextContent('Not account support, recovery, or trading advice.');

    fireEvent.click(sendButton);

    expect(dialog).not.toHaveTextContent('—');
    expect(screen.getByText('Write a short note first, then we can send it.')).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton).not.toBeDisabled();
  });

  it('submits fix-this-widget metadata through the host adapter prop and keeps success visible until Send another or Close this feedback', async () => {
    const submitFeedback = makeSubmitFeedback(feedbackResponse('The FAQ copy is confusing.'));

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: '  The FAQ copy is confusing.  ' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'dimitri@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));

    const [payload] = submittedBodies(submitFeedback);
    expect(payload).toMatchObject({
      source: 'fix_this_widget',
      note: 'The FAQ copy is confusing.',
      email: 'dimitri@example.com',
      element: null,
      page: {
        url: 'http://localhost:3000/?from=test',
        title: 'Landing | WTF is this tx?',
      },
      viewport: { w: 1280, h: 720 },
    });
    expect(typeof payload.ts).toBe('string');
    expect(payload).not.toHaveProperty('clientId');
    expect(payload).not.toHaveProperty('txHash');
    expect(payload).not.toHaveProperty('rating');
    expect(JSON.stringify(payload)).not.toMatch(/fullDom|outerHTML|innerHTML|screenshot|walletState|hiddenData|documentElement/i);

    expect(screen.getByRole('status')).not.toHaveTextContent('—');
    expect(screen.getByRole('status')).toHaveTextContent('Thanks. We read every note.');
    expect(screen.getByRole('status')).toHaveTextContent('If it shows a gap, agents can add an interpreter or improve the explanation for future visitors.');
    expect(screen.getByTestId('fix-this-widget-success-caveat').querySelector('br')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Send another$/i }));
    expect(screen.getByLabelText(/^Your feedback$/i)).toHaveValue('');
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'One more note.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: /^Close this feedback$/i }));
    expect(screen.queryByRole('dialog', { name: /^Send feedback$/i })).not.toBeInTheDocument();
  });

  it('supports a host context provider and optional picker disablement without owning client id storage', async () => {
    const submitFeedback = makeSubmitFeedback();
    const getContext = vi.fn(() => ({
      page: { url: 'https://example.test/custom', title: 'Custom page' },
      viewport: { w: 390, h: 844 },
      ts: '2026-06-01T00:00:00.000Z',
      requestId: 'req-widget-1',
      sessionId: 'session-widget-1',
    }));

    render(<FixThisWidget submitFeedback={submitFeedback} enableElementPicker={false} getContext={getContext} feedbackSource="host_widget" />);
    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));

    expect(screen.queryByRole('button', { name: /^＋ Point at an element$/i })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'Context override works.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));
    expect(submittedBodies(submitFeedback)[0]).toMatchObject({
      source: 'host_widget',
      note: 'Context override works.',
      page: { url: 'https://example.test/custom', title: 'Custom page' },
      viewport: { w: 390, h: 844 },
      ts: '2026-06-01T00:00:00.000Z',
      requestId: 'req-widget-1',
      sessionId: 'session-widget-1',
    });
  });

  it('keeps failed submissions editable and closes with explicit controls', async () => {
    const submitFeedback = vi.fn<SubmitFixThisWidgetFeedback>().mockRejectedValue(new Error('network down'));

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    const trigger = screen.getByRole('button', { name: /^Feedback$/i });
    fireEvent.click(trigger);
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'The footer overlaps the widget.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent("Couldn't send that feedback. Your note is still here, try again.");
    expect(submitFeedback).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/^Your feedback$/i)).toHaveValue('The footer overlaps the widget.');
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).not.toHaveTextContent('—');

    fireEvent.click(screen.getByRole('button', { name: /^Close feedback$/i }));
    expect(screen.queryByRole('dialog', { name: /^Send feedback$/i })).not.toBeInTheDocument();

    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /^Send feedback$/i })).not.toBeInTheDocument();
  });

  it('attaches removable metadata for a page element without capturing DOM or widget internals', async () => {
    const submitFeedback = makeSubmitFeedback(feedbackResponse('The CTA label is off.'));

    render(
      <>
        <button type="button" data-od-id="hero-submit-button">Analyze transaction</button>
        <FixThisWidget submitFeedback={submitFeedback} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'The CTA label is off.' } });
    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    expect(screen.getByText(/Point at an element, then click to attach it/i)).toBeInTheDocument();

    fireEvent.mouseMove(screen.getByRole('button', { name: /^Analyze transaction$/i }), { clientX: 24, clientY: 24 });
    expect(screen.getByTestId('fix-this-widget-floatlabel')).toHaveTextContent('Hero submit button');
    expect(screen.getByTestId('fix-this-widget-floatlabel')).toHaveTextContent('Button');
    expect(screen.getByTestId('fix-this-widget-highlight')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Analyze transaction$/i }));
    expect(screen.getByText('Hero submit button · Button')).toBeInTheDocument();
    expect(screen.getByText('[data-od-id="hero-submit-button"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));

    const [payload] = submittedBodies(submitFeedback);
    expect(payload.element).toEqual({
      odId: 'hero-submit-button',
      label: 'Hero submit button',
      type: 'Button',
      selector: '[data-od-id="hero-submit-button"]',
      text: 'Analyze transaction',
    });
    expect(JSON.stringify(payload.element)).not.toMatch(/outerHTML|innerHTML|<button|data-fix-this-widget/i);

    fireEvent.click(screen.getByRole('button', { name: /^Send another$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Feedback$/i }));
    expect(screen.queryByText(/Fix this widget ·/i)).not.toBeInTheDocument();
  });

  it('ships desktop popover, mobile bottom-sheet, picker overlay, z-index, and host-token fallbacks in the CSS sidecar', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf8');

    expect(css).toMatch(/\.fix-this-widget\s*\{[\s\S]*--fix-this-widget-footer-offset:\s*0px;/);
    expect(css).toMatch(/\.fix-this-widget-trigger\s*\{[\s\S]*position:\s*fixed;[\s\S]*bottom:\s*calc\(24px\s*\+\s*var\(--fix-this-widget-footer-offset,\s*0px\)\);[\s\S]*right:\s*24px;[\s\S]*min-height:\s*var\(--tap-min,\s*44px\);/);
    expect(css).toMatch(/\.fix-this-widget-panel\s*\{[\s\S]*bottom:\s*calc\(80px\s*\+\s*var\(--fix-this-widget-footer-offset,\s*0px\)\);[\s\S]*width:\s*360px;[\s\S]*max-height:\s*calc\(100vh\s*-\s*96px\s*-\s*var\(--fix-this-widget-footer-offset,\s*0px\)\);[\s\S]*overflow-y:\s*auto;/);
    expect(css).toMatch(/@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*\.fix-this-widget-panel\s*\{[\s\S]*left:\s*0;[\s\S]*right:\s*0;[\s\S]*bottom:\s*0;[\s\S]*width:\s*100%;[\s\S]*max-width:\s*100%;[\s\S]*border-radius:\s*var\(--r-xl,\s*24px\)\s+var\(--r-xl,\s*24px\)\s+0\s+0;/);
    expect(css).toMatch(/\.fix-this-widget-overlay\s*\{[\s\S]*position:\s*fixed;[\s\S]*z-index:\s*1002;/);
    expect(css).toMatch(/\.fix-this-widget-highlight\s*\{[\s\S]*z-index:\s*1003;[\s\S]*border:\s*2px\s+solid\s+var\(--primary,\s*#1D7A8C\);/);
    expect(css).toContain('var(--surface, #fff)');
    expect(css).toContain('var(--shadow-3, 0 20px 50px rgba(16, 20, 24, .18))');
  });
});
