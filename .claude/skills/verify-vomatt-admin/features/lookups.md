# Lookups

Admins manage dictionary items (lookups) grouped by type. The API can't list types, so the admin picks a type by name to see its active items, adds a type and key to also find an inactive item, and can add, edit, deactivate/activate and delete items.

## Sub-features

- `lookups-find-type` shows the active items of a type, or `No active items of this type.`.
- `lookups-find-key` shows one item by type and key, inactive ones included.
- `lookups-create` adds an item; the value must be JSON.
- `lookups-invalid-json` refuses a non-JSON value before calling the API.
- `lookups-toggle` deactivates and reactivates an item.
- `lookups-delete` removes an item after a confirmation.

## How to get to it (user POV)

- Choose `Lookups` in the sidebar, fill `Type` (and optionally `Key`), choose `Show`.
- Open `http://localhost:3033/lookups?type=<type>&key=<key>`.

## Driving it with browse

Preconditions:

- Signed in as `verify-admin@vomatt.test`.
- No `verify_type` items: `$C sql "SELECT count(*) FROM vomatt.lookup WHERE lookup_type='verify_type'"` prints `0`.

- **Open.** Run `$B click 'a:has-text("Lookups")'`. Heading `Lookups`, the `Show` form and the `New item` form are shown.
- **Invalid value.** Run `$B fill 'section input[name=lookupType]' verify_type`, `$B fill 'input[name=lookupKey]' alpha`, `$B fill 'textarea[name=lookupValue]' 'Alpha'` (unquoted), `$B click 'button:has-text("Add item")'`. The alert reads `Value must be valid JSON, e.g. "label", 24 or {"hours": 24}.` and the count query still prints `0`.
- **Create.** Fill `textarea[name=lookupValue]` with `'"Alpha"'` and click `Add item` again. `$C sql "SELECT lookup_key, is_active FROM vomatt.lookup WHERE lookup_type='verify_type'"` prints `alpha|t`.
- **Find by type.** Run `$B fill 'form:has(button:has-text("Show")) input[name=type]' verify_type` and `$B click 'button:has-text("Show")'`. The URL has `?type=verify_type`; section `Active items of verify_type` lists `alpha` with value `"Alpha"`.
- **Deactivate.** Run `$B goto 'http://localhost:3033/lookups?type=verify_type&key=alpha'` and `$B click 'section:has(h2:has-text("verify_type/alpha")) li button:has-text("Deactivate")'`. After a reload, the `verify_type/alpha` section shows `alpha` marked `inactive` with an `Activate` button, the active list says `No active items of this type.`, and SQL prints `alpha|f`.
- **Activate.** Click `Activate` in the same section. SQL prints `alpha|t`.
- **Delete.** Run `$B dialog-accept` then click `Delete` in that section. The section reads `No item with this type and key.` and the count query prints `0`.
- **Proof.** After create, deactivate and delete: screenshot, ARIA snapshot and SQL read into `$E/<step>.*`.

## Gotchas

- The table is `vomatt.lookup` (singular).
- With type and key both set, `alpha` appears in two sections; scope to `section:has(h2:has-text("verify_type/alpha"))` or the click hits the wrong one.
- The `Type` field exists in both forms; scope the create one with `section input[name=lookupType]` and the find one with `form:has(button:has-text("Show"))`.
- Editing can't clear an optional field: the API keeps the old value.
