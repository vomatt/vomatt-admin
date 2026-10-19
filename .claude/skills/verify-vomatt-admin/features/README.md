# vomatt-admin verification map

The maintained source for verifying what a staff user can do in vomatt-admin. Read this index, then follow the matching feature file. `$C` and `$B` are the helpers defined in [../SKILL.md](../SKILL.md).

## Baseline preconditions

- `$C up` has run in this checkout and `$C doctor` prints only `ok` lines.
- The admin is at `http://localhost:3033`, the API at `http://localhost:18080`, both started by this run.
- Accounts `verify-admin@vomatt.test` (admin) and `verify-user@vomatt.test` (no admin role) exist.
- The database has no tags and no lookups unless a recipe created them.

## Driving conventions

- Start from a signed-in admin browse session unless the recipe says signed out; sign in with the steps in SKILL.md › Drive.
- Select fields by `name`, buttons by their text, rows by their content, errors by `p[role=alert]`.
- Use the names in the recipes literally (`Verify tag`, `verify_type`, `alpha`) so cleanup and SQL checks match.
- Delete what a recipe created at its end, through the UI where the feature offers it; keep the proof.

## Proof and skip reporting

- Save a screenshot and an ARIA snapshot of the resulting state, plus a `$C sql` read of the stored value, under the run's evidence folder, one subfolder per feature.
- Record which entry point each artifact proves.
- When an entry point can't be reached, report the command tried and the precondition that failed. Don't count it as verified through another entry point.

## Feature entry contract

Each file has an H1, one paragraph on the user-visible behavior, then exactly these H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with browse`, `Gotchas`.

## Features

- [Sign in and out](./sign-in.md): OTP sign-in, redirect back, non-admin refusal, sign-out.
- [Tags](./tags.md): list, create, edit, delete tags.
- [Lookups](./lookups.md): find by type and key, create, deactivate/activate, delete lookup items.
- Not mapped yet: `Content (Sanity)` at `/sanity` needs a Sanity login of its own on top of the admin session, which this stack can't provide.
