'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { FeedbackForm } from './FeedbackForm';
import { FeedbackPickerOverlay } from './FeedbackPickerOverlay';
import { FeedbackSuccess } from './FeedbackSuccess';
import type { FixThisWidgetContext, FixThisWidgetContextOverride, FixThisWidgetFeedbackPayload, FixThisWidgetProps } from '../shared/types';
import { SITE_FOOTER_SELECTOR, useFixThisWidgetFooterStyle } from '../hooks/useFixThisWidgetFooterStyle';
import { useFixThisWidgetFormState } from '../hooks/useFixThisWidgetFormState';
import { useFixThisWidgetPicker } from '../hooks/useFixThisWidgetPicker';
import { useStableEvent } from '../hooks/useStableEvent';
import { mergeFixThisWidgetCopy } from '../shared/copy';

function defaultFixThisWidgetContext(): FixThisWidgetContext {
  return {
    page: { url: window.location.href, title: document.title },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    scroll: { x: window.scrollX, y: window.scrollY },
    ts: new Date().toISOString(),
  };
}

function mergeFixThisWidgetContext(
  fallback: FixThisWidgetContext,
  override: FixThisWidgetContextOverride = {},
): FixThisWidgetContext {
  const context: FixThisWidgetContext = {
    page: { ...fallback.page, ...override.page },
    viewport: { ...fallback.viewport, ...override.viewport },
    scroll: { ...fallback.scroll, ...override.scroll },
    ts: override.ts ?? fallback.ts,
  };
  const requestId = override.requestId ?? fallback.requestId;
  const sessionId = override.sessionId ?? fallback.sessionId;

  if (requestId !== undefined) context.requestId = requestId;
  if (sessionId !== undefined) context.sessionId = sessionId;

  return context;
}

function widgetId(baseId: string, suffix: string): string {
  return `fix-this-widget-${baseId.replace(/:/g, '')}-${suffix}`;
}

async function submitFeedbackToDefaultEndpoint(body: FixThisWidgetFeedbackPayload) {
  const response = await fetch('/api/fix-this-widget/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) throw new Error('Feedback submission failed');
}

export function FixThisWidget({
  submitFeedback = submitFeedbackToDefaultEndpoint,
  footerSelector = SITE_FOOTER_SELECTOR,
  enableElementPicker = true,
  collectEmail = true,
  feedbackSource = 'fix_this_widget',
  getContext,
  footerContext,
  copy,
}: FixThisWidgetProps) {
  const resolvedCopy = mergeFixThisWidgetCopy(copy);
  const reactId = useId();
  const panelId = widgetId(reactId, 'panel');
  const titleId = widgetId(reactId, 'title');
  const noteId = widgetId(reactId, 'note');
  const emailId = widgetId(reactId, 'email');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const rootStyle = useFixThisWidgetFooterStyle(footerSelector);
  const { state, noteIsEmpty, actions } = useFixThisWidgetFormState();
  const isSuccess = state.submitState === 'success';
  const picker = useFixThisWidgetPicker({
    rootRef,
    onAttach: actions.setAttached,
    onPanelOpenChange: actions.setOpen,
  });

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

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
      actions.markEmptyNote(resolvedCopy.emptyNoteMessage);
      noteRef.current?.focus();
      return;
    }

    actions.setSubmitState('submitting');
    actions.setMessage('');

    const trimmedEmail = state.email.trim();
    const context = mergeFixThisWidgetContext(defaultFixThisWidgetContext(), getContext?.());

    try {
      await submitFeedback({
        source: feedbackSource,
        note: state.note.trim(),
        ...(collectEmail && trimmedEmail ? { email: trimmedEmail } : {}),
        element: state.attached,
        ...context,
      });
      actions.setSubmitState('success');
    } catch {
      actions.setSubmitState('error');
      actions.setMessage(resolvedCopy.submitErrorMessage);
    }
  }

  function handleDone() {
    actions.resetForm();
    closePanel({ restoreFocus: true });
  }

  const widgetSurface = (
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
        <span>{resolvedCopy.trigger}</span>
      </button>

      {state.open ? (
        <div id={panelId} className="fix-this-widget-panel" role="dialog" aria-modal="false" aria-labelledby={titleId}>
          <div className="fix-this-widget-panel-head">
            <h2 id={titleId}>{resolvedCopy.title}</h2>
            <button type="button" className="fix-this-widget-close" aria-label={resolvedCopy.close} onClick={() => closePanel({ restoreFocus: true })}>
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>

          {isSuccess ? (
            <FeedbackSuccess copy={resolvedCopy} onSendAnother={actions.resetForm} onDone={handleDone} />
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
              collectEmail={collectEmail}
              footerContext={footerContext}
              copy={resolvedCopy}
              onStartPicking={picker.startPicking}
              onRemoveAttached={actions.clearAttached}
            />
          )}
        </div>
      ) : null}

      {picker.picking ? (
        <FeedbackPickerOverlay highlight={picker.highlight} copy={resolvedCopy} onCancel={() => picker.stopPicking(true)} />
      ) : null}
    </div>
  );

  return portalTarget ? createPortal(widgetSurface, portalTarget) : null;
}
