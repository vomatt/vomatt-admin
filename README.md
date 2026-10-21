# vomatt-admin

Staff app for vomatt: admin views on vomatt-api's `/api/admin/**`, and the Sanity Studio at `/sanity`. The public site is `vomatt-web`.

See `IMPLEMENTATION_PLAN.md` for what's built and what's next.

## Local development

```bash
npm install
npm run dev   # http://localhost:3003 (vomatt-web uses 3002)
```

Copy `.env.example` to `.env.local` and fill in the Sanity project ID (same as vomatt-web).
Studio: http://localhost:3003/sanity (sign in with your Sanity account).

## Checks

```bash
npm run lint
npx tsc --noEmit
npm run test
npm run build
```

## Sanity Function: refresh vomatt-web on publish

`functions/invalidate-tags` (declared in `sanity.blueprint.ts`) is a Sync Tag Invalidate function: when published content in `urdaqaow.production` is queryable, it POSTs to vomatt-web's `/api/revalidate` so edits show up right away. One-time setup:

```bash
npx sanity blueprints init --stack-name production --project-id urdaqaow   # links this blueprint to a stack
npx sanity functions env add invalidate-tags SANITY_REVALIDATE_SECRET <value>   # same value as vomatt-web's
npx sanity blueprints deploy
npx sanity functions logs invalidate-tags
```
