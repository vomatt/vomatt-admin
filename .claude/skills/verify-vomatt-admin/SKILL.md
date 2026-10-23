---
name: verify-vomatt-admin
description: Drive the vomatt-admin web console (OTP sign-in, Tags, Lookups) in a headless browser against a throwaway local vomatt-api, and capture proof. Use to prove a change to admin pages, auth/proxy, or admin API calls works the way a staff user sees it.
---

# Verify vomatt-admin

Runs this checkout's admin app on port 3033 against its own vomatt-api, Postgres and Redis (compose project `vomatt-admin-verify`, ports 18080/15432/16379), so it never touches a developer's `npm run dev` on 3003, their API on 8080, or other verify stacks. Drive it with gstack `browse`, a headless Chromium CLI.

```bash
C=.claude/skills/verify-vomatt-admin/bin/control-admin
B=~/.claude/skills/gstack/browse/dist/browse
```

## Launch

```bash
$C up                # REBUILD=1 $C up rebuilds the API image from ../vomatt-api
```

Needs Docker running and the vomatt-api repo next to this one (the script resolves it from the main checkout, so worktrees work; override with `VOMATT_API_DIR`). `up` starts the compose stack with `--wait`, waits for `/actuator/health`, seeds two accounts, runs `npm ci` if `node_modules` is missing, starts `next dev --port=3033` with `API_URL=http://localhost:18080` and the compose file's `JWT_SECRET` as `SESSION_SECRET`, and waits until `/login` answers. Ready means it printed `up: admin http://localhost:3033` and an `evidence:` path. The first run builds the API image (a few minutes); later runs reuse it, so pass `REBUILD=1` when the API source changed.

Seeded accounts (test values that exist only in this stack): `verify-admin@vomatt.test` (roles `user, admin`) and `verify-user@vomatt.test` (role `user`). Emails are never sent: read the code with `$C otp <email>`.

`up` refuses when it is already up or when one of its ports belongs to something it did not start. Never drive the developer's own server on 3003.

## Doctor

```bash
$C doctor
```

Read-only. Every line must say `ok`: our `next dev` pid is alive and owns port 3033, `/login` renders the sign-in form, the API health is `UP` on 18080, and the admin account is seeded. It also prints the git commit (with `+uncommitted` when the tree has changes) and the evidence folder. Run it first and whenever a step behaves oddly. `$C sql "<query>"` runs SQL in the stack's Postgres (schema `vomatt`) for side-effect checks.

## Drive

Sign in once, then keep the browse session for every feature (its cookies persist across commands):

```bash
$B goto http://localhost:3033/tags                    # signed out: lands on /login?redirect=%2Ftags
$B fill 'input[name=email]' verify-admin@vomatt.test
$B click 'button[type=submit]'                        # "Send code"
$B wait 'input[name=code]'
$B fill 'input[name=code]' "$($C otp verify-admin@vomatt.test)"
$B click 'button[type=submit]'                        # "Sign in"
$B wait '[data-slot=sidebar]'; $B url                  # http://localhost:3033/tags
```

Handles: form fields by `name` (`email`, `code`, `name`, `slug`, `description`, `displayOrder`, `lookupType`, `lookupKey`, `lookupValue`, `seq`, `frontendUsing`), buttons by text (`button:has-text("Add tag")`), rows by content (`li:has-text("Verify tag")`), errors by `p[role=alert]`. `$B snapshot -i` lists the interactive elements with `@e` refs when a selector is ambiguous. Read an error with `$B js "document.querySelector('p[role=alert]')?.textContent"`.

The feature recipes are in [features/README.md](features/README.md). A proof covers every entry point the feature file lists, not just the convenient one.

## Evidence

Write proof under the folder `up` printed, `/private/tmp/vomatt-admin-verify/evidence/<run>/<feature>/` (browse may only write under `/private/tmp` or the repo):

```bash
E=/private/tmp/vomatt-admin-verify/evidence/$(cat /private/tmp/vomatt-admin-verify/state/run)/tags; mkdir -p "$E"
$B screenshot "$E/after-create.png"
$B snapshot > "$E/after-create.aria.txt"
$C sql "SELECT name, slug, description, display_order FROM vomatt.tags WHERE name='Verify tag'" > "$E/after-create.sql.txt"
```

Proof standards:

- Go through the real UI path: the form and buttons a staff user uses, not the server actions or the API directly.
- Capture the action and the resulting state: the page after the action and a second, read-only view of the stored value (`$C sql`, or reload the page).
- Check side effects, not only what the screen shows: rows in `vomatt.tags` / `vomatt.lookup`, the `accessToken`/`refreshToken` cookies (`$B cookies`) for auth changes, `/private/tmp/vomatt-admin-verify/state/next.log` for the server action and API calls (each call is logged with secrets masked).
- Nothing is mocked: the API, Postgres and Redis are real, only email delivery is off.

## Cleanup

```bash
$C down
```

Kills only the `next dev` it started (by pid), runs `docker compose down -v` for project `vomatt-admin-verify` (its data goes, other stacks stay), stops the browse server, removes the `AGENTS.md` that `next dev` writes and the `.gstack/` line browse adds to `.gitignore` when this run created them, and deletes `/private/tmp/vomatt-admin-verify/state`. It keeps `/private/tmp/vomatt-admin-verify/evidence/`. `/private/tmp` is cleared on reboot: copy proof elsewhere if it must last.

## Helpers

`bin/control-admin up|doctor|otp <email>|otp-reset <email>|sql <query>|down`, shown above. `otp` and `otp-reset` cover both the admin console's sign-in (`otp:admin-email:*`) and the public one (`otp:email:*`); `otp` prints the newer code when both hold one. `otp-reset` clears the API's 180-second resend cooldown and pending code for an email in this stack's Redis, for when a recipe needs a second sign-in. `compose.verify.yml` is the port and image override layered on `../vomatt-api/docker-compose.yml`.

## Gotchas

- The Next dev-tools badge sits on top of `Sign out` (bottom left), so the click times out. Remove the overlay first: `$B js "document.querySelectorAll('nextjs-portal').forEach(e => e.remove())"`.
- `Send code` failing with `common.unauthorized` (401 on `/api/auth/admin/send-otp` in `next.log`) means the API image predates the admin sign-in endpoints: `$C down`, then `REBUILD=1 $C up`.
- A second `Send code` for the same email within 180 s is refused (`auth.otp.resend_cooldown`) and the code field never appears. Stay signed in, or run `$C otp-reset <email>` first.
- The 5th wrong code locks OTP sign-in for the caller's IP (`auth.otp.too_many_attempts`).
- API error messages come back in Chinese by default (`請等 57 秒後再重新發送`); match on the alert's presence or on `errorCode` in `next.log`, not on the English text.
- `Delete` opens a `confirm()` dialog. Run `$B dialog-accept` before the click.
- A fresh database has no tags, no lookups and no polls; each recipe creates what it needs.
