import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { FixThisWidget } from "fix-this-widget";
import "fix-this-widget/styles.css";
import "./example.css";

function App() {
    return (
        <main className="example-shell">
            <section className="example-card">
                <p className="example-eyebrow">zero-config example</p>
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
           Just add it here, Zero config, done!
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
