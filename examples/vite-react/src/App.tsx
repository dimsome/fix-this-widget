import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { FixThisWidget } from 'fix-this-widget';
import 'fix-this-widget/styles.css';
import './example.css';

function App() {
  return (
    <main className="example-shell">
      <section className="example-hero">
        <p className="example-eyebrow">Embeddable package demo</p>
        <h1>Collect page feedback with direct element selection.</h1>
        <p>
          Click the feedback control, write a note, then point at one of these elements to attach useful metadata and
          bounded sanitized context.
        </p>
        <button type="button">Primary demo action</button>
      </section>

      <section className="example-card" aria-label="Pricing summary">
        <h2>Card with normal semantic markup</h2>
        <p>This section is here so you can try the picker on text, headings, buttons, and grouped content.</p>
      </section>

      <FixThisWidget />
    </main>
  );
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
