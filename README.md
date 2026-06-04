# fix-this-widget

Standalone React feedback widget for collecting compact, actionable fix requests from a host app.

Package name: `fix-this-widget`

## Requirements

- React `>=18.2.0 <21.0.0`
- A client-rendered React surface. In Next.js App Router, render the widget from a client component.
- A POST endpoint at `/api/fix-this-widget/feedback` if you use the default JSONL storage path.
- A Node/server runtime with a writable filesystem for default JSONL storage. Use `submitFeedback` for serverless, database, or external storage.

## Install

```bash
npm install fix-this-widget
```

## Usage

Add the widget and stylesheet:

```tsx
import { FixThisWidget } from 'fix-this-widget';
import 'fix-this-widget/styles.css';

function App() {
  return <FixThisWidget />;
}
```

By default the widget posts feedback to `/api/fix-this-widget/feedback`. The package ships a small server helper that appends each payload to newline-delimited JSON.

For Next.js App Router, add this route:

```ts
// app/api/fix-this-widget/feedback/route.ts
import { createFixThisWidgetHandler } from 'fix-this-widget/server';

export const POST = createFixThisWidgetHandler();
```

That writes to `feedback/fix-this-widget.jsonl` relative to the app working directory. Pass `filePath` if you want a different file:

```ts
const handler = createFixThisWidgetHandler({
  filePath: 'data/feedback.jsonl',
});
```

If you want to send feedback somewhere else, override `submitFeedback`:

```tsx
<FixThisWidget
  submitFeedback={async (payload) => {
    const response = await fetch('/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error('Feedback submission failed');
  }}
/>
```

The callback may resolve with `void` or any host response; the widget only needs success or failure.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `submitFeedback` | `(payload) => Promise<void \| unknown>` | POST to `/api/fix-this-widget/feedback` | Override where feedback is sent. Omit it for the package default endpoint. |
| `enableElementPicker` | `boolean` | `true` | Lets users point to the page element they want fixed. |
| `feedbackSource` | `string` | `fix_this_widget` | Labels submitted feedback for your backend or analytics pipeline. |
| `getContext` | `() => Partial<FixThisWidgetContext>` | page URL, title, viewport, timestamp | Adds or overrides page, viewport, timestamp, request ID, or session ID fields. |
| `footerSelector` | `string` | `footer, [role="contentinfo"]` | Advanced escape hatch for unusual layouts. The default detects normal semantic footers without app attributes. |

## Default JSONL storage

`createFixThisWidgetHandler()` accepts a standard `Request` and returns a standard `Response`, so it can be used by frameworks that expose Web Fetch handlers.

```ts
import { createFixThisWidgetHandler } from 'fix-this-widget/server';

export const POST = createFixThisWidgetHandler();
```

Each submitted payload is appended as one JSON object per line:

```jsonl
{"source":"fix_this_widget","note":"The CTA is unclear.","element":null,"page":{"url":"https://example.test","title":"Example"},"viewport":{"w":1280,"h":720},"ts":"2026-06-03T00:00:00.000Z"}
```

Use your own `submitFeedback` when you need auth, database storage, issue creation, analytics, or another backend.

## Element picker data

The element picker works without marking up your app. Users can point at an element and the widget attaches bounded metadata for that target. It does not serialize the full page DOM and does not capture screenshots.

The selector picker uses the best stable identifier it can find, including `data-feedback-id`, test IDs, `id`, `aria-label`, `name`, and a short tag-path fallback.

The attached element payload includes:

- `label`: readable label for the target
- `type`: coarse target type, such as `Button`, `Link`, `Input`, or `Card/Section`
- `selector`: best selector candidate
- `selectorCandidates`: fallback selector candidates
- `text`: normalized visible text, capped at 80 characters
- `context`: bounded sanitized snippets for the target and, when useful, a nearby landmark parent

Only safe identifying attributes are included in context snippets. Class names, styles, arbitrary `data-*` attributes, full DOM markup, and screenshots are excluded.

You can add `data-feedback-id` to important UI elements for extra precision, but it is optional.

## Styling

The stylesheet is required. It uses namespaced CSS custom properties so host apps can customize without relying on broad token names:

```css
.fix-this-widget {
  --fix-this-widget-primary: #7c3aed;
  --fix-this-widget-primary-hover: #6d28d9;
  --fix-this-widget-surface: #fff;
  --fix-this-widget-radius-xl: 24px;
}
```

## Example app

![fix-this-widget example app](./docs/assets/example-closed.png)

A Vite example lives in [`examples/vite-react`](./examples/vite-react):

```bash
npm run build
cd examples/vite-react
npm install
npm run dev
```

The example uses the local package via `file:../..`. Its Vite dev server wires `/api/fix-this-widget/feedback` to the package JSONL helper and writes submissions to `feedback/fix-this-widget.example.jsonl`.

## Exports

- `fix-this-widget`: React component and TypeScript types
- `fix-this-widget/styles.css`: CSS sidecar required for the widget UI
- `fix-this-widget/element-metadata`: element metadata helper for tests or host adapters
- `fix-this-widget/server`: JSONL storage helpers for the default endpoint

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm pack --dry-run --json
```

`npm run build` emits ESM JavaScript, declaration files, server helpers, and `dist/styles.css`.

For release commands, see [RELEASE.md](./RELEASE.md).
