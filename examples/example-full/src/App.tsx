import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixThisWidget } from 'fix-this-widget';
import type { FixThisWidgetFeedbackPayload } from 'fix-this-widget';
import 'fix-this-widget/styles.css';
import './example.css';

async function submitFullConfigFeedback(payload: FixThisWidgetFeedbackPayload) {
  const response = await fetch('/api/fix-this-widget/full-config-feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      example: 'full-config',
    }),
  });

  if (!response.ok) throw new Error('Feedback submission failed');
}

function getFullConfigContext() {
  return {
    page: {
      url: window.location.href,
      title: `${document.title} · full config example`,
    },
    viewport: {
      w: window.innerWidth,
      h: window.innerHeight,
    },
    scroll: {
      x: window.scrollX,
      y: window.scrollY,
    },
    ts: new Date().toISOString(),
    requestId: crypto.randomUUID(),
    sessionId: 'demo-session-full-config',
  };
}

function App() {
  return (
    <main className="example-shell">
      <section className="example-card example-card-wide">
        <p className="example-eyebrow">full-config example</p>
        <h1>Every widget prop wired.</h1>
        <p>
          This version passes a custom submit handler, footer selector, picker toggle, email collection,
          source label, context builder, and footer helper copy.
        </p>
      </section>

      <section className="example-card example-grid" aria-label="Configurable product surface">
        <article>
          <h2>Billing summary</h2>
          <p>Pick this card, the button, or the input to see element metadata attached to the payload.</p>
          <button type="button">Upgrade plan</button>
        </article>

        <label className="example-field">
          Workspace name
          <input type="text" defaultValue="Acme Analytics" />
        </label>
      </section>

      <footer className="example-footer full-config-footer">
        The custom footer selector keeps the floating widget above this footer.
      </footer>

      <FixThisWidget
        submitFeedback={submitFullConfigFeedback}
        footerSelector=".full-config-footer"
        enableElementPicker={true}
        collectEmail={true}
        feedbackSource="full_config_example"
        getContext={getFullConfigContext}
        copy={{
          trigger: 'Report UI issue',
          title: 'Send product feedback',
          noteLabel: 'What should we fix?',
          notePlaceholder: 'Describe the issue or improvement.',
          submit: 'Send report',
          successTitle: 'Feedback saved',
          successDescription: 'The team can review this note with the selected UI context.',
        }}
        footerContext={(
          <span>
            Demo config: payloads post to <code>/api/fix-this-widget/full-config-feedback</code> with
            request and session IDs.
          </span>
        )}
      />
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
