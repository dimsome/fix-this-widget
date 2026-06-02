# fix-this-widget

Standalone React feedback widget for collecting compact, actionable fix requests from a host app.

Package name: `@dimsome/fix-this-widget`

## Status

This repo contains a buildable package extraction. It is not published. Publishing is a human step and should not be performed by agents.

## Install from a local checkout

```bash
npm install /path/to/fix-this-widget
```

Or consume it from a branch or packed tarball after human review.

## Usage

```tsx
import { FixThisWidget } from '@dimsome/fix-this-widget';
import '@dimsome/fix-this-widget/styles.css';

function App() {
  return (
    <FixThisWidget
      submitFeedback={async (payload) => {
        await fetch('/your-feedback-endpoint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
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

`FixThisWidget` defaults to a compact payload source of `fix_this_widget`. If a host app needs to preserve an existing backend contract during migration, pass `feedbackSource="global_widget"` or map the payload inside `submitFeedback`.

A compatibility alias is exported for migration:

```tsx
import { GlobalFeedbackWidget } from '@dimsome/fix-this-widget';
```

Prefer `FixThisWidget` for new code.

## Props

- `submitFeedback`: required async host adapter. The widget calls this with the note, optional email, safe element metadata, page metadata, viewport metadata, timestamp, and optional request/session IDs.
- `footerSelector`: optional selector used to keep the floating control above a visible footer. Defaults to `[data-od-id="site-footer"]`.
- `enableElementPicker`: optional boolean. Defaults to `true`.
- `feedbackSource`: optional string. Defaults to `fix_this_widget`.
- `getContext`: optional host context provider for page, viewport, timestamp, request ID, or session ID.

## Exports

- `@dimsome/fix-this-widget`: React component, compatibility alias, and TypeScript types.
- `@dimsome/fix-this-widget/styles.css`: CSS sidecar required for the widget UI.
- `@dimsome/fix-this-widget/element-metadata`: safe DOM element metadata helper for tests or host adapters.

## Non-goals

This package owns only the widget UI and client boundary. It does not include:

- Backend routes or API clients
- Database or persistence code
- Local storage or anonymous client ID ownership
- DOM capture, HTML dumps, screenshots, wallet state, hidden data, or full-page snapshots
- WTF-specific API calls
- Publishing automation

The host app owns transport, authentication, client/session IDs, persistence, logging, and any backend validation.

## Development

```bash
npm install
npm run typecheck
npm run lint
npm test
npm run build
```

`npm run build` emits ESM JavaScript, declaration files, and `dist/styles.css`. Do not run `npm publish` from automation.
