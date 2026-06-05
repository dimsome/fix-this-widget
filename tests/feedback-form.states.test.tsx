import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { FeedbackElementMetadata } from '../src';
import { FeedbackForm } from '../src/components/FeedbackForm';
import { FIX_THIS_WIDGET_DEFAULT_COPY } from '../src/shared/copy';

type FormOverrides = Partial<{
  note: string;
  email: string;
  attached: FeedbackElementMetadata | null;
  message: string;
  submitState: 'idle' | 'submitting' | 'success' | 'error';
  footerContext: string;
  collectEmail: boolean;
}>;

function renderFeedbackForm(overrides: FormOverrides = {}) {
  const props = {
    noteId: 'test-note',
    emailId: 'test-email',
    note: overrides.note ?? '',
    email: overrides.email ?? '',
    attached: overrides.attached ?? null,
    message: overrides.message ?? '',
    submitState: overrides.submitState ?? 'idle',
    noteRef: createRef<HTMLTextAreaElement>(),
    onNoteChange: vi.fn(),
    onEmailChange: vi.fn(),
    onSubmit: vi.fn((event: React.FormEvent<HTMLFormElement>) => event.preventDefault()),
    onStartPicking: vi.fn(),
    onRemoveAttached: vi.fn(),
    footerContext: overrides.footerContext,
    collectEmail: overrides.collectEmail,
    copy: FIX_THIS_WIDGET_DEFAULT_COPY,
  };

  const result = render(<FeedbackForm {...props} />);
  return { ...props, ...result };
}

describe('fix-this-widget form states', () => {
  it('keeps an empty-note form submittable while marking it aria-disabled', () => {
    const props = renderFeedbackForm({ message: 'Write a short note first, then we can send it.' });

    const sendButton = screen.getByRole('button', { name: /^Send feedback$/i });
    expect(sendButton).toHaveAttribute('aria-disabled', 'true');
    expect(sendButton).not.toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'Helpful note' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'dimitri@example.com' } });

    expect(props.onNoteChange).toHaveBeenCalledWith('Helpful note');
    expect(props.onEmailChange).toHaveBeenCalledWith('dimitri@example.com');
  });

  it('hides optional email collection when disabled', () => {
    const props = renderFeedbackForm({ collectEmail: false });

    expect(screen.queryByLabelText(/^Email/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Your feedback$/i), { target: { value: 'No reply needed.' } });

    expect(props.onNoteChange).toHaveBeenCalledWith('No reply needed.');
    expect(props.onEmailChange).not.toHaveBeenCalled();
  });

  it('renders attached-element and submitting states without changing form ownership', () => {
    const attached: FeedbackElementMetadata = {
      label: 'Hero submit button',
      type: 'Button',
      selector: '[data-feedback-id="hero-submit-button"]',
      selectorCandidates: ['[data-feedback-id="hero-submit-button"]', 'button'],
      bounds: { top: 10, left: 20, width: 120, height: 40 },
      text: 'Analyze transaction',
      context: {
        path: 'button',
        target: '<button data-feedback-id="hero-submit-button">Analyze transaction</button>',
        parent: null,
      },
    };
    const props = renderFeedbackForm({ note: 'Ready to submit', attached, submitState: 'submitting' });

    expect(screen.getByText('Hero submit button · Button')).toBeInTheDocument();
    expect(screen.getByText('[data-feedback-id="hero-submit-button"]')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sending…$/i })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: /^Remove attached element$/i }));

    expect(props.onRemoveAttached).toHaveBeenCalledTimes(1);
  });
});
