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
      <div className="fix-this-widget-field">
        <label className="fix-this-widget-label" htmlFor="fix-this-widget-note">Your feedback</label>
        <textarea
          ref={noteRef}
          id="fix-this-widget-note"
          name="note"
          placeholder="What's working, or what's off?"
          value={note}
          onChange={(event) => onNoteChange(event.currentTarget.value)}
        />
      </div>

      <div className="fix-this-widget-field">
        <label className="fix-this-widget-label" htmlFor="fix-this-widget-email">Email <span>(optional, if you'd like a reply)</span></label>
        <input
          id="fix-this-widget-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.currentTarget.value)}
        />
      </div>

      {enableElementPicker ? (
        <div className="fix-this-widget-field">
          <span className="fix-this-widget-label">Attach an element <span>(optional)</span></span>
          {attached ? (
            <div className="fix-this-widget-chip">
              <span className="fix-this-widget-chip-text">
                <span className="fix-this-widget-chip-label">{attached.label} · {attached.type}</span>
                <code>{attached.selector}</code>
              </span>
              <button type="button" aria-label="Remove attached element" onClick={onRemoveAttached}>×</button>
            </div>
          ) : (
            <button type="button" className="fix-this-widget-attach" onClick={onStartPicking}>＋ Point at an element</button>
          )}
        </div>
      ) : null}

      {message ? <p className="fix-this-widget-message" role={submitState === 'error' ? 'alert' : undefined}>{message}</p> : null}

      <div className="fix-this-widget-footer">
        <button
          type="submit"
          className="fix-this-widget-primary"
          aria-disabled={noteIsEmpty}
          disabled={submitState === 'submitting'}
        >
          {submitState === 'submitting' ? 'Sending…' : 'Send feedback'}
        </button>
      </div>

      <FeedbackCaveat testId="fix-this-widget-form-caveat" />
    </form>
  );
}
