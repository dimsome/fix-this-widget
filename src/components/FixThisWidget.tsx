'use client';

import { useEffect, useId, useRef } from 'react';
import type { FormEvent } from 'react';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackPickerOverlay } from './FeedbackPickerOverlay';
import { FeedbackSuccess } from './FeedbackSuccess';
import type { FixThisWidgetContext, FixThisWidgetProps } from '../shared/types';
import { SITE_FOOTER_SELECTOR, useFixThisWidgetFooterStyle } from '../hooks/useFixThisWidgetFooterStyle';
import { useFixThisWidgetFormState } from '../hooks/useFixThisWidgetFormState';
import { useFixThisWidgetPicker } from '../hooks/useFixThisWidgetPicker';
import { useStableEvent } from '../hooks/useStableEvent';

function defaultFixThisWidgetContext(): FixThisWidgetContext {
  return {
    page: { url: window.location.href, title: document.title },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ts: new Date().toISOString(),
  };
}

function widgetId(baseId: string, suffix: string): string {
  return `fix-this-widget-${baseId.replace(/:/g, '')}-${suffix}`;
}

export function FixThisWidget({
  submitFeedback,
  footerSelector = SITE_FOOTER_SELECTOR,
  enableElementPicker = true,
  feedbackSource = 'fix_this_widget',
  getContext = defaultFixThisWidgetContext,
}: FixThisWidgetProps) {
  const reactId = useId();
  const panelId = widgetId(reactId, 'panel');
  const titleId = widgetId(reactId, 'title');
  const noteId = widgetId(reactId, 'note');
  const emailId = widgetId(reactId, 'email');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const rootStyle = useFixThisWidgetFooterStyle(footerSelector);
  const { state, noteIsEmpty, actions } = useFixThisWidgetFormState();
  const isSuccess = state.submitState === 'success';
  const picker = useFixThisWidgetPicker({
    rootRef,
    onAttach: actions.setAttached,
    onPanelOpenChange: actions.setOpen,
  });

  function closePanel({ restoreFocus = false }: { restoreFocus?: boolean } = {}) {
    actions.closePanel();
    if (restoreFocus) triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!state.open || isSuccess) return;
    noteRef.current?.focus();
  }, [state.open, isSuccess]);

  const onDocumentKeyDown = useStableEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    if (picker.picking) {
      event.preventDefault();
      picker.stopPicking(true);
      return;
    }

    if (state.open) closePanel({ restoreFocus: true });
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      onDocumentKeyDown(event);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDocumentKeyDown]);

  const onDocumentMouseDown = useStableEvent((event: MouseEvent) => {
    if (!state.open || picker.picking) return;

    const target = event.target;
    if (target instanceof Node && rootRef.current?.contains(target)) return;

    closePanel();
  });

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      onDocumentMouseDown(event);
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [onDocumentMouseDown]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (noteIsEmpty) {
      actions.markEmptyNote();
      noteRef.current?.focus();
      return;
    }

    actions.setSubmitState('submitting');
    actions.setMessage('');

    try {
      await submitFeedback({
        source: feedbackSource,
        note: state.note.trim(),
        email: state.email.trim() || undefined,
        element: state.attached,
        ...getContext(),
      });
      actions.setSubmitState('success');
    } catch {
      actions.setSubmitState('error');
      actions.setMessage("Couldn't send that feedback. Your note is still here, try again.");
    }
  }

  function handleDone() {
    actions.resetForm();
    closePanel({ restoreFocus: true });
  }

  return (
    <div ref={rootRef} className="fix-this-widget" data-fix-this-widget style={rootStyle}>
      <button
        ref={triggerRef}
        type="button"
        className="fix-this-widget-trigger"
        aria-haspopup="dialog"
        aria-expanded={state.open}
        aria-controls={panelId}
        onClick={() => {
          if (picker.picking) return;
          actions.toggleOpen();
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.4 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.1A8.38 8.38 0 0 1 4 11.5 8.5 8.5 0 0 1 12.5 3 8.38 8.38 0 0 1 21 11.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Feedback</span>
      </button>

      {state.open ? (
        <div id={panelId} className="fix-this-widget-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
          <div className="fix-this-widget-panel-head">
            <h2 id={titleId}>Send feedback</h2>
            <button type="button" className="fix-this-widget-close" aria-label="Close feedback" onClick={() => closePanel({ restoreFocus: true })}>×</button>
          </div>

          {isSuccess ? (
            <FeedbackSuccess onSendAnother={actions.resetForm} onDone={handleDone} />
          ) : (
            <FeedbackForm
              noteId={noteId}
              emailId={emailId}
              note={state.note}
              email={state.email}
              attached={state.attached}
              message={state.message}
              submitState={state.submitState}
              noteRef={noteRef}
              onNoteChange={actions.setNote}
              onEmailChange={actions.setEmail}
              onSubmit={handleSubmit}
              enableElementPicker={enableElementPicker}
              onStartPicking={picker.startPicking}
              onRemoveAttached={actions.clearAttached}
            />
          )}
        </div>
      ) : null}

      {picker.picking ? (
        <FeedbackPickerOverlay highlight={picker.highlight} onCancel={() => picker.stopPicking(true)} />
      ) : null}
    </div>
  );
}
