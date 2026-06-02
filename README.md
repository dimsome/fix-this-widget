# fix-this-widget

Standalone React feedback widget for collecting compact, actionable fix requests from a host app.

Package name: `@dimsome/fix-this-widget`

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

        return {
          kind: 'feedback',
          feedbackId: 'server-generated-id',
          created: true,
          rating: null,
          note: payload.note,
        };
      }}
    />
  );
}
```

`submitFeedback` is the integration point. Your app decides where feedback goes, how requests are authenticated, and how submitted feedback is stored.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `submitFeedback` | `(payload) => Promise<FixThisWidgetFeedbackResponse>` | required | Sends the note, optional email, page context, viewport context, selected element metadata, timestamp, and optional request/session IDs. |
| `footerSelector` | `string` | `[data-od-id="site-footer"]` | Keeps the floating control above a visible footer. |
| `enableElementPicker` | `boolean` | `true` | Lets users point to the page element they want fixed. |
| `feedbackSource` | `string` | `fix_this_widget` | Labels submitted feedback for your backend or analytics pipeline. |
| `getContext` | `() => Partial<FixThisWidgetContext>` | `undefined` | Adds host-provided page, viewport, timestamp, request ID, or session ID fields. |

## Element picker data

When the element picker is enabled, the widget sends a small metadata object for the selected element. It includes fields such as tag name, text label, role, test ID, stable selector hints, and bounding box. It does not serialize page HTML or screenshots.

Use `getContext` for any app-specific context you want attached to feedback submissions.

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
