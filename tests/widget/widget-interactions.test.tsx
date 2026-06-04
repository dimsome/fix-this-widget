import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as widgetPackage from '../../src';
import { FixThisWidget } from '../../src';
import type { FixThisWidgetFeedbackResponse, SubmitFixThisWidgetFeedback } from '../../src';

function feedbackResponse(note = 'Saved'): FixThisWidgetFeedbackResponse {
  return { kind: 'feedback', feedbackId: 'feedback_1', created: true, rating: null, note };
}

function makeSubmitFeedback(response: FixThisWidgetFeedbackResponse | void = feedbackResponse()) {
  return vi.fn<SubmitFixThisWidgetFeedback>().mockResolvedValue(response);
}

function submittedBodies(submitFeedback: ReturnType<typeof makeSubmitFeedback>): Record<string, unknown>[] {
  return submitFeedback.mock.calls.map(([body]) => body as unknown as Record<string, unknown>);
}

function setViewport(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('fix-this-widget package', () => {
  beforeEach(() => {
    document.title = 'Landing | WTF is this tx?';
    window.history.pushState({}, '', '/?from=test');
    setViewport(1280, 720);
  });

  it('exports FixThisWidget without old GlobalFeedback aliases', () => {
    expect(widgetPackage.FixThisWidget).toBe(FixThisWidget);
    expect(widgetPackage).not.toHaveProperty('GlobalFeedbackWidget');
  });


  it('posts to the default feedback endpoint when no submit adapter is configured', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<FixThisWidget />);
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'Zero config should work.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith('/api/fix-this-widget/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: expect.any(String),
    });
    expect(JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string)).toMatchObject({
      source: 'fix_this_widget',
      note: 'Zero config should work.',
    });
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for the feedback');
  });

  it('opens the form, validates an empty note inline, and keeps Send feedback clickable', () => {
    const submitFeedback = makeSubmitFeedback();

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));

    const dialog = screen.getByRole('dialog', { name: /^Send feedback$/i });
    const sendButton = within(dialog).getByRole('button', { name: /^Send feedback$/i });
    expect(sendButton).not.toBeDisabled();

    expect(screen.queryByTestId('fix-this-widget-form-caveat')).not.toBeInTheDocument();
    expect(dialog).not.toHaveTextContent(/We read every note/i);
    expect(dialog).not.toHaveTextContent('Useful feedback can trigger agents to fix or improve this app.');
    expect(dialog).not.toHaveTextContent('Not account support, recovery, or trading advice.');

    fireEvent.click(sendButton);

    expect(dialog).not.toHaveTextContent('—');
    expect(screen.getByText('Write a short note first, then we can send it.')).toBeInTheDocument();
    expect(submitFeedback).not.toHaveBeenCalled();
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton).not.toBeDisabled();
  });

  it('renders optional footer context below the submit button', () => {
    render(<FixThisWidget submitFeedback={makeSubmitFeedback()} footerContext="We use this to prioritize small UI fixes." />);
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));

    const dialog = screen.getByRole('dialog', { name: /^Send feedback$/i });
    const context = within(dialog).getByTestId('fix-this-widget-footer-context');

    expect(context).toHaveTextContent('We use this to prioritize small UI fixes.');
  });

  it('can disable optional email collection and omits email from the submitted payload', async () => {
    const submitFeedback = makeSubmitFeedback();

    render(<FixThisWidget submitFeedback={submitFeedback} collectEmail={false} />);
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));

    const dialog = screen.getByRole('dialog', { name: /^Send feedback$/i });
    expect(within(dialog).queryByLabelText(/^Email/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'No email field, please.' } });
    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));

    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));
    expect(submittedBodies(submitFeedback)[0]).toMatchObject({
      source: 'fix_this_widget',
      note: 'No email field, please.',
    });
    expect(submittedBodies(submitFeedback)[0]).not.toHaveProperty('email');
  });

  it('submits fix-this-widget metadata through the host adapter prop and keeps success visible until Send another or Close this feedback', async () => {
    const submitFeedback = makeSubmitFeedback();

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));
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
    expect(screen.getByRole('status')).toHaveTextContent('Thanks for the feedback');
    expect(screen.getByRole('status')).toHaveTextContent('We will evaluate the feedback and adjust accordingly if needed.');
    expect(screen.queryByTestId('fix-this-widget-success-caveat')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));

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

  it('renders multiple widget instances with distinct generated ids and label wiring', () => {
    render(
      <>
        <FixThisWidget submitFeedback={makeSubmitFeedback()} feedbackSource="team" />
        <FixThisWidget submitFeedback={makeSubmitFeedback()} feedbackSource="users" />
      </>,
    );

    const triggers = screen.getAllByRole('button', { name: /^Fix This$/i });
    fireEvent.click(triggers[0]);
    fireEvent.click(triggers[1]);

    const dialogs = screen.getAllByRole('dialog', { name: /^Send feedback$/i });
    const noteIds = dialogs.map((dialog) => within(dialog).getByLabelText(/^Your feedback$/i).id);
    const emailIds = dialogs.map((dialog) => within(dialog).getByLabelText(/^Email/i).id);
    const panelIds = dialogs.map((dialog) => dialog.id);

    expect(new Set(noteIds).size).toBe(2);
    expect(new Set(emailIds).size).toBe(2);
    expect(new Set(panelIds).size).toBe(2);
    expect(triggers[0]).toHaveAttribute('aria-controls', panelIds[0]);
    expect(triggers[1]).toHaveAttribute('aria-controls', panelIds[1]);
  });

  it('keeps failed submissions editable and closes with explicit controls', async () => {
    const submitFeedback = vi.fn<SubmitFixThisWidgetFeedback>().mockRejectedValue(new Error('network down'));

    render(<FixThisWidget submitFeedback={submitFeedback} />);
    const trigger = screen.getByRole('button', { name: /^Fix This$/i });
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
        <button type="button" data-feedback-id="hero-submit-button">Analyze transaction</button>
        <FixThisWidget submitFeedback={submitFeedback} />
      </>,
    );

    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'The CTA label is off.' } });
    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    expect(screen.getByText(/Point at an element, then click to attach it/i)).toBeInTheDocument();

    fireEvent.mouseMove(screen.getByRole('button', { name: /^Analyze transaction$/i }), { clientX: 24, clientY: 24 });
    expect(screen.getByTestId('fix-this-widget-floatlabel')).toHaveTextContent('Hero submit button');
    expect(screen.getByTestId('fix-this-widget-floatlabel')).toHaveTextContent('Button');
    expect(screen.getByTestId('fix-this-widget-highlight')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Analyze transaction$/i }));
    expect(screen.getByText('Hero submit button · Button')).toBeInTheDocument();
    expect(screen.getByText('[data-feedback-id="hero-submit-button"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Send feedback$/i }));
    await waitFor(() => expect(submitFeedback).toHaveBeenCalledTimes(1));

    const [payload] = submittedBodies(submitFeedback);
    expect(payload.element).toEqual({
      label: 'Hero submit button',
      type: 'Button',
      selector: '[data-feedback-id="hero-submit-button"]',
      selectorCandidates: ['[data-feedback-id="hero-submit-button"]', 'button'],
      text: 'Analyze transaction',
      context: {
        path: 'button',
        target: '<button type="button" data-feedback-id="hero-submit-button">Analyze transaction</button>',
        parent: null,
      },
    });
    expect(JSON.stringify(payload.element)).not.toMatch(/outerHTML|innerHTML|<span|data-fix-this-widget/i);

    fireEvent.click(screen.getByRole('button', { name: /^Send another$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Cancel$/i }));
    expect(screen.getByRole('dialog', { name: /^Send feedback$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^＋ Point at an element$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^Fix This$/i }));
    expect(screen.queryByText(/Fix this widget ·/i)).not.toBeInTheDocument();
  });
});
