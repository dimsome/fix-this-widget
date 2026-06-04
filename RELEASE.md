# Release

## Package

- npm package: `fix-this-widget`
- Registry access: public unscoped package
- Publish command: `npm publish`

## Preflight

```bash
npm whoami
npm install
npm run check
```

Inspect the dry-run output before publishing. The package should contain `package.json`, `README.md`, and built `dist` files only.

## Publish

```bash
npm publish
```

## After publishing

Update consuming apps to depend on the npm package instead of a local vendored package.

## Rollback

npm versions cannot be overwritten after publishing. If a bad version ships, deprecate it and publish a fixed patch version:

```bash
npm deprecate fix-this-widget@<version> "reason"
npm version patch
npm publish
```
