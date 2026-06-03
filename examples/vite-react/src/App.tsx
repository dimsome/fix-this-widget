import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixThisWidget } from '@dimsome/fix-this-widget';
import type { FixThisWidgetFeedbackPayload } from '@dimsome/fix-this-widget';
import '@dimsome/fix-this-widget/styles.css';
import './example.css';

async function submitFeedback(payload: FixThisWidgetFeedbackPayload): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 250));
  console.info('Example feedback payload', payload);
}

function App() {
  return (
    <main className="example-shell">
      <section className="example-hero" data-feedback-id="example-hero">
        <p className="example-eyebrow">Embeddable package demo</p>
        <h1>Collect page feedback with direct element selection.</h1>
        <p>
          Click the feedback control, write a note, then point at one of these elements to attach stable metadata and
          bounded sanitized context.
        </p>
        <button type="button" data-feedback-id="primary-demo-action">Primary demo action</button>
      </section>

      <section className="example-card" data-feedback-id="pricing-card" aria-label="Pricing summary">
        <h2>Card with a stable feedback id</h2>
        <p>This section is here so you can try the picker on text, headings, buttons, and grouped content.</p>
      </section>

      <FixThisWidget
        submitFeedback={submitFeedback}
        getContext={() => ({
          page: { url: window.location.href, title: document.title },
          viewport: { w: window.innerWidth, h: window.innerHeight },
          ts: new Date().toISOString(),
          sessionId: 'example-session',
        })}
      />
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
