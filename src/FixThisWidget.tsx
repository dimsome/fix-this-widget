'use client';

import { useEffect, useEffectEvent, useRef } from 'react';
import type { FormEvent } from 'react';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackPickerOverlay } from './FeedbackPickerOverlay';
import { FeedbackSuccess } from './FeedbackSuccess';
import type { FixThisWidgetContext, FixThisWidgetProps } from './types';
import { SITE_FOOTER_SELECTOR, useFixThisWidgetFooterStyle } from './useFixThisWidgetFooterStyle';
import { useFixThisWidgetFormState } from './useFixThisWidgetFormState';
import { useFixThisWidgetPicker } from './useFixThisWidgetPicker';

function defaultFixThisWidgetContext(): FixThisWidgetContext {
  return {
    page: { url: window.location.href, title: document.title },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    ts: new Date().toISOString(),
  };
}

export function FixThisWidget({
  submitFeedback,
  footerSelector = SITE_FOOTER_SELECTOR,
  enableElementPicker = true,
  feedbackSource = 'fix_this_widget',
  getContext = defaultFixThisWidgetContext,
}: FixThisWidgetProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const rootStyle = useFixThisWidgetFooterStyle(footerSelector);
  const { state, noteIsEmpty, actions } = useFixThisWidgetFormState();
  const isSuccess = state.submitState === 'success';
  const picker = useFixThisWidgetPicker({
    rootRef,
    onAttach: actions.setAttached,
    onPanelOpenChange: actions.setOpen,
  });

  useEffect(() => {
    if (!state.open || isSuccess) return;
    noteRef.current?.focus();
  }, [state.open, isSuccess]);

  const onDocumentKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;

    if (picker.picking) {
      event.preventDefault();
      picker.stopPicking(true);
      return;
    }

    if (state.open) actions.closePanel();
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      onDocumentKeyDown(event);
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const onDocumentMouseDown = useEffectEvent((event: MouseEvent) => {
    if (!state.open || picker.picking) return;

    const target = event.target;
    if (target instanceof Node && rootRef.current?.contains(target)) return;

    actions.closePanel();
  });

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      onDocumentMouseDown(event);
    }

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

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
    actions.closePanel();
  }

  return (
    <div ref={rootRef} className="fix-this-widget" data-fix-this-widget style={rootStyle}>
      <button
        type="button"
        className="fix-this-widget-trigger"
        aria-haspopup="dialog"
        aria-expanded={state.open}
        aria-controls="fix-this-widget-panel"
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
        <div id="fix-this-widget-panel" className="fix-this-widget-panel" role="dialog" aria-modal="false" aria-labelledby="fix-this-widget-title">
          <div className="fix-this-widget-panel-head">
            <h2 id="fix-this-widget-title">Send feedback</h2>
            <button type="button" className="fix-this-widget-close" aria-label="Close feedback" onClick={actions.closePanel}>×</button>
          </div>

          {isSuccess ? (
            <FeedbackSuccess onSendAnother={actions.resetForm} onDone={handleDone} />
          ) : (
            <FeedbackForm
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
