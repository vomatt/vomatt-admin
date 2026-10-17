# vomatt-admin: implementation plan

A Next.js app that hosts two things for staff:

- **Admin views** backed by vomatt-api's `/api/admin/**` (tags, lookups, later users and moderation), behind the API's admin login.
- **Sanity Studio** at `/sanity`, moved here from vomatt-web so the public site stops shipping it.

Separate repo (decided). vomatt-web keeps reading Sanity content (`next-sanity`, `@sanity/client`, `@sanity/image-url`, `queries.ts`, `live.ts`, `image.ts`).

## Decisions

- **Same stack as vomatt-web**: Next 16 App Router, TypeScript, Tailwind v4, shadcn/ui (new-york, zinc), Jest (jsdom), ESLint (next/core-web-vitals + simple-import-sort). Copy the configs; don't introduce new tools.
- **Auth mirrors vomatt-web**: tokens in httpOnly cookies; refresh **only** in `src/proxy.tsx` (the backend revokes every session when a used refresh token comes back). Login uses OTP with `checkRole: "true"`.
- **Admin check is the `roles` claim**: the proxy lets a request through only when the access token's `roles` includes `admin`. `checkRole` only guards the login step, and a role change takes effect at the next refresh.
- **`/sanity` sits behind the admin login too**. Sanity still asks for its own login on top. Only the login page is reachable without a session.
- **Copied code names its source**: each file copied from vomatt-web starts with `// Mirrors vomatt-web <path>; change both`. That's the price of separate repos.

## Stage 1: Scaffold
**Goal**: an empty Next app with vomatt-web's toolchain, deployable to its own Vercel project.
**Success Criteria**: `npm run build`, `npm run lint`, `npm run test`, `npx tsc --noEmit` all pass; the dev server runs on port 3003 (3002 is vomatt-web).
**Tests**: one smoke test (root page renders) to prove the Jest setup.
**Status**: Complete (Vercel project not created yet)

- Copy from vomatt-web: `tsconfig.json`, `eslint.config.mjs`, `jest.config.ts`, `jest.setup.ts`, `postcss.config.mjs`, `components.json`, `src/styles/global.css` (tokens), the security headers from `next.config.ts`.
- README, CLAUDE.md. `.env.example` starts in Stage 2, when the first variable is needed.

## Stage 2: Move Sanity Studio to `/sanity`
**Goal**: the Studio runs from vomatt-admin against the same project and dataset; vomatt-web still has its copy (it's removed in Stage 5).
**Success Criteria**: a document edited and published in the admin Studio shows on vomatt-web within 60s; Vision appears only for administrator/developer roles; "Open page" links on slugs go to the **public site**, not the admin domain.
**Tests**: port `src/__tests__/sanity/SlugField.test.ts`, updated so `getUrl` uses the configured site URL.
**Status**: In Progress — Studio loads at `localhost:3003/sanity` (login screen, no console errors). Left: sign in and check an edit reaches vomatt-web; add the production origin to Sanity CORS.

- Move: `sanity.config.ts`, `sanity.cli.ts`, `src/app/(sanity)/` (keep its own root layout so admin CSS doesn't leak in), `src/sanity/{schemaTypes,deskStructure,migrations}`, `structure.ts`, `defaultDocumentNode.ts`, `env.ts`, `lib/utils.tsx`.
- **The schema imports web code** from `@/lib/utils`: `resolveHref`, `isValidUrl`, `getIcon`. Copied into `src/sanity/lib/site.ts` (social icons in `socialIcons.tsx`) with the "Mirrors" header. `resolveHref` maps document types to public routes, so it must stay in sync with vomatt-web's routes.
- **`SlugField.getUrl` uses `window.location.origin`**, which assumes the Studio is served by the site. Change it to `NEXT_PUBLIC_SITE_URL` (the public vomatt-web origin).
- Dependencies: `sanity`, `next-sanity`, `@sanity/{vision,ui,icons,color-input}`, `sanity-plugin-media`, `sanity-plugin-note-field` (keep the `overrides` entry), `styled-components`, `react-is`, `rxjs`, `react-icons`. (`@sanity/util` and `@swc/plugin-styled-components` aren't imported or configured in web, so they weren't brought over.)
- Sanity project CORS: `http://localhost:3003` is allowed (with credentials); the admin production origin still needs adding.

## Stage 3: Admin auth
**Goal**: staff sign in with OTP; everything except `/login` needs a valid admin session.
**Success Criteria**: signed-out request → redirected to `/login`; non-admin account → `auth.admin.forbidden` shown and no session; a token without `admin` in `roles` → signed out; an expired access token is refreshed once in the proxy and the page loads.
**Tests**: port `tokens` and proxy tests from vomatt-web; add one for the role check and one for redirect-when-signed-out.
**Status**: Not Started

- Copy from vomatt-web `src/lib/api/`: `tokens.ts`, `auth.ts`, `client.ts`, `backend-fetch.ts`, `action.ts`, `auth-errors.ts`, `constants.ts`, `cursor.ts`, plus the auth parts of `services/auth.ts` and `proxy.tsx` (without locale detection unless the admin UI is bilingual).
- Env: `API_URL`, `SESSION_SECRET` (= API `JWT_SECRET`), `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `NEXT_PUBLIC_SITE_URL`.

## Stage 4: First admin view (tags)
**Goal**: prove the pattern end to end on `/api/admin/tags`: list, create, edit.
**Success Criteria**: an admin can list, create and edit a tag; API errors (`errorCode`) show as messages; a 403 sends the user back to login.
**Tests**: service functions return `ActionResult` for success/error; the list renders items and an empty state.
**Status**: Not Started

- Admin layout: sidebar with "Tags", "Lookups" (Stage 4+), and a "Content (Sanity)" link to `/sanity`.
- Lookups and other views follow the same pattern after this stage; they're outside this plan.

## Stage 5: Remove the Studio from vomatt-web
**Goal**: vomatt-web ships no Studio code; `/sanity` redirects to the admin app.
**Success Criteria**: vomatt-web `build`, `lint`, `test`, `tsc` pass; site pages, login copy, share image and apple-app-site-association still load Sanity content; `node_modules` drops the Studio packages.
**Tests**: vomatt-web's `live.test.ts` and `image.test.ts` still pass; `SlugField.test.ts` moves out (Stage 2).
**Status**: Not Started

- Delete: `src/app/(sanity)/`, `sanity.config.ts`, `sanity.cli.ts`, `src/sanity/{schemaTypes,deskStructure,migrations}`, `structure.ts`, `defaultDocumentNode.ts`, `lib/utils.tsx`, `__tests__/sanity/SlugField.test.ts`.
- Keep: `src/sanity/{env.ts, lib/client.ts, lib/live.ts, lib/image.ts, lib/queries.ts}`.
- Drop dependencies: `sanity`, `@sanity/{vision,ui,icons,color-input,util}`, `sanity-plugin-media`, `sanity-plugin-note-field` (+ its `overrides`), `styled-components`, `@swc/plugin-styled-components`, `rxjs`, `react-is` (check nothing else imports them first).
- `next.config.ts`: add a `/sanity/:path*` redirect to the admin origin. Set `NEXT_PUBLIC_SANITY_STUDIO_URL` to the admin `/sanity` URL.
- Update vomatt-web README and CLAUDE.md (Studio location, setup steps).
- Do this only after Stage 2 is deployed and editors have switched over.

## Open questions

- Admin production domain (e.g. `admin.vomatt.com`)?
- Admin UI language: English only, or `en`/`zh` like vomatt-web?
- Schema drift: vomatt-web's GROQ queries depend on a schema that now lives here. Add Sanity TypeGen in vomatt-web later (new tooling, so not in this plan), or accept manual checks.
