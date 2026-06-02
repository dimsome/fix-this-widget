# fix-this-widget

Standalone React feedback widget for collecting compact, actionable fix requests from a host app.

Package name: `@dimsome/fix-this-widget`

## Status

This repo contains a buildable package that is prepared for public npm publishing. It is not published yet. Publishing is a human step and should not be performed by agents.

Recommended npm target: `@dimsome/fix-this-widget` with public scoped access. The unscoped `fix-this-widget` name also returns 404 on npm today, but the scoped package keeps ownership clear under the `@dimsome` namespace and avoids occupying a generic global name.

## Install

After the first approved npm release:

```bash
npm install @dimsome/fix-this-widget
```

Before release, consume it from a local checkout, Git branch, or packed tarball after review:

```bash
npm install /path/to/fix-this-widget
```

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

## Compatibility alias

`GlobalFeedbackWidget` and the related `GlobalFeedback*` TypeScript aliases are exported only to ease migrations from older host apps:

```tsx
import { GlobalFeedbackWidget } from '@dimsome/fix-this-widget';
```

Prefer `FixThisWidget` names for all new code. Treat the compatibility aliases as transitional API surface.

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
- Host-app-specific transport or API calls
- Publishing automation

The host app owns transport, authentication, client/session IDs, persistence, logging, and any backend validation.

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

## Release checklist

Do not publish from automation. For a human release:

1. Confirm the PR is reviewed and merged.
2. Confirm npm auth can publish under the `@dimsome` scope:
   ```bash
   npm whoami
   npm access ls-packages @dimsome
   ```
3. Re-run the local release gates:
   ```bash
   npm install
   npm test
   npm run typecheck
   npm run lint
   npm run build
   npm pack --dry-run --json
   ```
4. Inspect the dry-run tarball contents. It should contain only package metadata, README, and built `dist` files.
5. Publish the scoped public package only after explicit approval:
   ```bash
   npm publish --access public
   ```
6. After publishing, update host apps to depend on `@dimsome/fix-this-widget` from npm instead of a local vendored package.

Rollback if a bad version ships: deprecate the version with `npm deprecate @dimsome/fix-this-widget@<version> "reason"`, publish a fixed patch version, and update consuming apps to the patched version.
