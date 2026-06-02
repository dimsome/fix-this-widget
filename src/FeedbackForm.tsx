import type { FormEventHandler, Ref } from 'react';
import type { FeedbackElementMetadata, FeedbackSubmitState } from './types';
import { FeedbackCaveat } from './FeedbackCaveat';

export type FeedbackFormProps = {
  note: string;
  email: string;
  attached: FeedbackElementMetadata | null;
  message: string;
  submitState: FeedbackSubmitState;
  noteRef: Ref<HTMLTextAreaElement>;
  onNoteChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  enableElementPicker?: boolean;
  onStartPicking: () => void;
  onRemoveAttached: () => void;
};

export function FeedbackForm({
  note,
  email,
  attached,
  message,
  submitState,
  noteRef,
  onNoteChange,
  onEmailChange,
  onSubmit,
  enableElementPicker = true,
  onStartPicking,
  onRemoveAttached,
}: FeedbackFormProps) {
  const noteIsEmpty = note.trim().length === 0;

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="global-feedback-field">
        <label className="global-feedback-label" htmlFor="global-feedback-note">Your feedback</label>
        <textarea
          ref={noteRef}
          id="global-feedback-note"
          name="note"
          placeholder="What's working, or what's off?"
          value={note}
          onChange={(event) => onNoteChange(event.currentTarget.value)}
        />
      </div>

      <div className="global-feedback-field">
        <label className="global-feedback-label" htmlFor="global-feedback-email">Email <span>(optional, if you'd like a reply)</span></label>
        <input
          id="global-feedback-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.currentTarget.value)}
        />
      </div>

      {enableElementPicker ? (
        <div className="global-feedback-field">
          <span className="global-feedback-label">Attach an element <span>(optional)</span></span>
          {attached ? (
            <div className="global-feedback-chip">
              <span className="global-feedback-chip-text">
                <span className="global-feedback-chip-label">{attached.label} · {attached.type}</span>
                <code>{attached.selector}</code>
              </span>
              <button type="button" aria-label="Remove attached element" onClick={onRemoveAttached}>×</button>
            </div>
          ) : (
            <button type="button" className="global-feedback-attach" onClick={onStartPicking}>＋ Point at an element</button>
          )}
        </div>
      ) : null}

      {message ? <p className="global-feedback-message" role={submitState === 'error' ? 'alert' : undefined}>{message}</p> : null}

      <div className="global-feedback-footer">
        <button
          type="submit"
          className="global-feedback-primary"
          aria-disabled={noteIsEmpty}
          disabled={submitState === 'submitting'}
        >
          {submitState === 'submitting' ? 'Sending…' : 'Send feedback'}
        </button>
      </div>

      <FeedbackCaveat testId="global-feedback-form-caveat" />
    </form>
  );
}
