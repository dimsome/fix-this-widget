# Release

## Package

- npm package: `@dimsome/fix-this-widget`
- Registry access: public scoped package
- Publish command: `npm publish --access public`

## Preflight

```bash
npm whoami
npm access ls-packages @dimsome
npm install
npm run check
```

Inspect the dry-run output before publishing. The package should contain `package.json`, `README.md`, and built `dist` files only.

## Publish

```bash
npm publish --access public
```

## After publishing

Update consuming apps to depend on the npm package instead of a local vendored package.

## Rollback

npm versions cannot be overwritten after publishing. If a bad version ships, deprecate it and publish a fixed patch version:

```bash
npm deprecate @dimsome/fix-this-widget@<version> "reason"
npm version patch
npm publish --access public
```
