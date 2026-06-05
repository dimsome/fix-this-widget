import type { FormEventHandler, ReactNode, Ref } from 'react';
import type { FeedbackElementMetadata, FeedbackSubmitState, FixThisWidgetCopy } from '../shared/types';

export type FeedbackFormProps = {
  noteId: string;
  emailId: string;
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
  collectEmail?: boolean;
  footerContext?: ReactNode;
  copy: FixThisWidgetCopy;
  onStartPicking: () => void;
  onRemoveAttached: () => void;
};

export function FeedbackForm({
  noteId,
  emailId,
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
  collectEmail = true,
  footerContext,
  copy,
  onStartPicking,
  onRemoveAttached,
}: FeedbackFormProps) {
  const noteIsEmpty = note.trim().length === 0;

  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="fix-this-widget-field">
        <label className="fix-this-widget-label" htmlFor={noteId}>{copy.noteLabel}</label>
        <textarea
          ref={noteRef}
          id={noteId}
          className="fix-this-widget-note"
          name="note"
          placeholder={copy.notePlaceholder}
          value={note}
          onChange={(event) => onNoteChange(event.currentTarget.value)}
        />
      </div>

      {collectEmail ? (
        <div className="fix-this-widget-field">
          <label className="fix-this-widget-label" htmlFor={emailId}>{copy.emailLabel} <span>({copy.emailOptionalText})</span></label>
          <input
            id={emailId}
            className="fix-this-widget-email"
            name="email"
            type="email"
            placeholder={copy.emailPlaceholder}
            autoComplete="email"
            value={email}
            onChange={(event) => onEmailChange(event.currentTarget.value)}
          />
        </div>
      ) : null}

      {enableElementPicker ? (
        <div className="fix-this-widget-field">
          <span className="fix-this-widget-label">{copy.attachElementLabel} <span>({copy.attachElementOptionalText})</span></span>
          {attached ? (
            <div className="fix-this-widget-chip">
              <span className="fix-this-widget-chip-text">
                <span className="fix-this-widget-chip-label">{attached.label} · {attached.type}</span>
                <code>{attached.selector}</code>
              </span>
              <button type="button" aria-label={copy.removeAttachedElement} onClick={onRemoveAttached}>×</button>
            </div>
          ) : (
            <button type="button" className="fix-this-widget-attach" onClick={onStartPicking}>{copy.attachElementButton}</button>
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
          {submitState === 'submitting' ? copy.submitting : copy.submit}
        </button>
      </div>

      {footerContext ? (
        <div className="fix-this-widget-footer-context" data-testid="fix-this-widget-footer-context">
          {footerContext}
        </div>
      ) : null}
    </form>
  );
}
