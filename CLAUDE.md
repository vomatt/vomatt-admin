# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev           # Start dev server (Turbopack, port 3003)
npm run build         # Production build
npm run lint          # ESLint (next/core-web-vitals + simple-import-sort)
npm run test          # Jest (jsdom)
npm run type-check    # Generate route types (PageProps), then tsc --noEmit
```

Tests live in `src/__tests__/` and match `**/*.test.{ts,tsx}`.

## Architecture

Staff-only Next.js 16 App Router app, separate from the public site `vomatt-web` (sibling repo). Work follows `IMPLEMENTATION_PLAN.md`.

- `src/app/(admin)/` — admin views on vomatt-api `/api/admin/**`; its own root layout.
- `src/app/(sanity)/` — Sanity Studio at `/sanity` (`sanity.config.ts`, schemas in `src/sanity/schemaTypes/`); its own root layout so admin CSS stays out of the Studio.

## API contract (vomatt-api)

The contract is `../vomatt-api/docs/frontend/openapi.json` (generated, ~340 KB). Read only the admin part: paths under `/api/admin/**` (tags `Admin - *`, `Admin Tag`) plus the `components/schemas` they `$ref`. Don't read the whole file or the public endpoints. Extract it with jq:

```bash
jq '.paths | with_entries(select(.key | startswith("/api/admin")))' ../vomatt-api/docs/frontend/openapi.json
jq '.components.schemas.<Name>' ../vomatt-api/docs/frontend/openapi.json   # resolve a $ref
```

Shared conventions (auth, errors) are in `../vomatt-api/docs/frontend/` (`conventions.md`, `auth-flow.md`, `error-codes.md`).

## Code copied from vomatt-web

Same stack and conventions as vomatt-web (Tailwind v4, shadcn/ui new-york/zinc, Geist, OKLCh tokens). Files copied from it start with a `Mirrors vomatt-web <path>; change both` comment: when you change one, change the other. Today: `src/styles/global.css`, `src/lib/routes.ts`, `src/lib/api/` (except `admin.ts`, `constants.ts`, `auth-errors.ts`), `src/lib/api/services/auth.ts`, `src/proxy.ts`, `src/__tests__/lib/tokens.test.ts`, `src/sanity/lib/site.ts`, `src/sanity/lib/socialIcons.tsx`, `src/components/BrandLogo.tsx`, and the Studio (`sanity.config.ts`, `src/sanity/`) until vomatt-web drops its copy in Stage 5.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
