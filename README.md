# fix-this-widget

Standalone React feedback widget for collecting compact, actionable fix requests from a host app.

Package name: `@dimsome/fix-this-widget`

## Requirements

- React `>=18.2.0 <21.0.0`
- A client-rendered React surface. In Next.js App Router, render the widget from a client component.

## Install

```bash
npm install @dimsome/fix-this-widget
```

Import the component and its stylesheet:

```tsx
import { FixThisWidget } from '@dimsome/fix-this-widget';
import '@dimsome/fix-this-widget/styles.css';
```

## Usage

```tsx
import { FixThisWidget } from '@dimsome/fix-this-widget';
import '@dimsome/fix-this-widget/styles.css';

function App() {
  return (
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
  );
}
```

`submitFeedback` is the integration point. Your app decides where feedback goes, how requests are authenticated, and how submitted feedback is stored. The callback may resolve with `void` or any host response; the widget only needs success or failure.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `submitFeedback` | `(payload) => Promise<void \| unknown>` | required | Sends the note, optional email, page context, viewport context, selected element metadata, timestamp, and optional request/session IDs. |
| `footerSelector` | `string` | `[data-od-id="site-footer"]` | Keeps the floating control above a visible footer. |
| `enableElementPicker` | `boolean` | `true` | Lets users point to the page element they want fixed. |
| `feedbackSource` | `string` | `fix_this_widget` | Labels submitted feedback for your backend or analytics pipeline. |
| `getContext` | `() => Partial<FixThisWidgetContext>` | `undefined` | Adds host-provided page, viewport, timestamp, request ID, or session ID fields. |

## Element picker data

When the element picker is enabled, the widget sends bounded metadata for the selected element. It does not serialize the full page DOM and does not capture screenshots.

The selector picker prefers public stable attributes in this order:

1. `data-feedback-id`
2. `data-testid`
3. `data-test`
4. `data-cy`
5. `id`
6. `aria-label`
7. `name`
8. `data-od-id` legacy fallback
9. a short tag path fallback

The attached element payload includes:

- `label`: readable label for the target
- `type`: coarse target type, such as `Button`, `Link`, `Input`, or `Card/Section`
- `selector`: best selector candidate
- `selectorCandidates`: fallback selector candidates
- `text`: normalized visible text, capped at 80 characters
- `context`: bounded sanitized snippets for the target and, when useful, a nearby landmark parent

Only safe identifying attributes are included in context snippets. Class names, styles, arbitrary `data-*` attributes, full DOM markup, and screenshots are excluded.

Use `data-feedback-id` on important UI elements if you want precise feedback attachments without exposing implementation-specific selectors.

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

The example uses the local package via `file:../..` and logs submitted payloads to the browser console.

## Exports

- `@dimsome/fix-this-widget`: React component and TypeScript types
- `@dimsome/fix-this-widget/styles.css`: CSS sidecar required for the widget UI
- `@dimsome/fix-this-widget/element-metadata`: element metadata helper for tests or host adapters

## Development

```bash
npm install
npm test
npm run typecheck
npm run lint
npm run build
npm pack --dry-run --json
```

`npm run build` emits ESM JavaScript, declaration files, and `dist/styles.css`.

For release commands, see [RELEASE.md](./RELEASE.md).
