# Tags

Admins manage the poll tags: the page lists every tag with its order, slug, description and usage count, and offers a form to add one and per-row Edit and Delete.

## Sub-features

- `tags-list` shows every tag, or `No tags yet.` when there are none.
- `tags-create` adds a tag; an empty slug is derived from the name.
- `tags-edit` replaces a tag's fields in place.
- `tags-delete` removes a tag after a confirmation.
- `tags-error` shows an API error (e.g. a duplicate name) under the form.

## How to get to it (user POV)

- Choose `Tags` in the sidebar.
- Open `http://localhost:3033/tags`.

## Driving it with browse

Preconditions:

- Signed in as `verify-admin@vomatt.test`.
- No tag named `Verify tag`: `$C sql "SELECT count(*) FROM vomatt.tags WHERE name='Verify tag'"` prints `0`.

- **Open.** Run `$B click 'a:has-text("Tags")'`. Heading `Tags` is shown and, on a fresh database, `No tags yet.`.
- **Create.** Run `$B fill 'form:has(input[name=name]) input[name=name]' 'Verify tag'`, `$B fill 'input[name=description]' 'Created by verify run'`, `$B fill 'input[name=displayOrder]' 7`, `$B click 'button:has-text("Add tag")'`. `$B wait 'li:has-text("Verify tag")'` succeeds; the row shows `7`, `verify-tag`, `Created by verify run`, `0 polls`. `$C sql "SELECT name, slug, description, display_order FROM vomatt.tags WHERE name='Verify tag'"` prints `Verify tag|verify-tag|Created by verify run|7`.
- **Duplicate.** Create `Verify tag` again with the same steps. `$B wait 'p[role=alert]'` succeeds and the table still has one `Verify tag` row.
- **Edit.** Run `$B click 'li:has-text("Verify tag") button:has-text("Edit")'`, `$B fill 'li form input[name=description]' 'Edited by verify run'`, `$B click 'li form button:has-text("Save")'`. `$B wait 'li:has-text("Edited by verify run")'` succeeds and the SQL read shows the new description.
- **Delete.** Run `$B dialog-accept` then `$B click 'li:has-text("Verify tag") button:has-text("Delete")'`. The row disappears (`No tags yet.` on a fresh database) and the count query prints `0`.
- **Proof.** After create, edit and delete: `$B screenshot "$E/<step>.png"`, `$B snapshot > "$E/<step>.aria.txt"`, and the SQL read into `"$E/<step>.sql.txt"`.

## Gotchas

- A failed create keeps its input and alert on screen, so later snapshots still show them.
- The create form and an open edit form both have `input[name=name]`; scope selectors with `li form` for edit and `form:has(...)` for create.
- `Delete` uses `confirm()`; without `$B dialog-accept` first the click hangs.
- The list comes from the public `GET /api/tags`, the writes from `/api/admin/tags`; check both the page and SQL.
