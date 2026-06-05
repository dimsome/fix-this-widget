import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FixThisWidget } from "fix-this-widget";
import "fix-this-widget/styles.css";
import "./example.css";

function App() {
    return (
        <main className="example-shell">
            <section className="example-card">
                <p className="example-eyebrow">default endpoint example</p>
                <h1>Point, describe, send.</h1>
                <p>
                    Use the Fix This button to attach a page element and write a
                    short note.
                </p>
                <button type="button">Example button</button>
            </section>

            <section className="example-card" aria-label="Example content">
                <h2>Example content</h2>
                <p>
                    A plain card with text, a heading, and normal semantic
                    markup for the picker to target.
                </p>
            </section>

            {/*
           The widget UI uses defaults here. This example's Vite middleware supplies
           the matching /api/fix-this-widget/feedback endpoint for local storage.
            */}
            <FixThisWidget />
        </main>
    );
}

createRoot(document.getElementById("root") as HTMLElement).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
