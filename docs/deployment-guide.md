# Deployment Guide

## Overview

`cb-zoo` publishes to npm manually. CI verifies release readiness but does not publish.

## Manual npm Release

### Prerequisites

- Clean git tree
- Green GitHub Actions checks
- npm account already authenticated locally
- Version, changelog, and README already updated

### Preflight

```bash
npm ci
npm run release:check
npm whoami
```

- `npm run release:check` runs syntax checks, `npm test`, CLI smoke checks, coverage, and `npm pack --dry-run`.
- If `npm whoami` fails, fix auth before doing anything else.

### Publish

```bash
npm publish --access public
```

### Post-publish

```bash
npm view cb-zoo version
npm view cb-zoo dist-tags
```

- Confirm the published version matches `package.json`.
- Spot-check install and help output from a clean shell if the release is user-facing.

## Notes

- `prepublishOnly` runs `npm run release:verify` automatically before `npm publish`.
- Do not commit npm tokens, `.env` files, or local Claude state.
- If publish fails after verification, inspect the npm error first. Do not bypass the release checks.
