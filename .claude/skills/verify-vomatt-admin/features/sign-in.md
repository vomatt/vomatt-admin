# Sign in and out

Staff sign in with an emailed one-time code. Only accounts with the admin role get in; every page except `/login` sends a signed-out visitor to the login page and back to where they were going after sign-in.

## Sub-features

- `signin-redirect` sends a signed-out request to `/login?redirect=<path>`.
- `signin-otp` signs an admin in with email + code and returns to the requested page.
- `signin-forbidden` refuses an account without the admin role before any code is sent.
- `signin-already` sends a signed-in admin who opens `/login` to the home page.
- `signout` ends the session and clears both auth cookies.

## How to get to it (user POV)

- Open any admin URL while signed out, e.g. `http://localhost:3033/tags`.
- Open `http://localhost:3033/login` directly.
- Choose `Sign out` at the bottom of the sidebar.

## Driving it with browse

Preconditions:

- Signed out (fresh browse session, or after `signout`).
- No sign-in for the email in the last 180 s, or `$C otp-reset <email>` run.

- **Redirect.** Open a protected page. Run `$B goto http://localhost:3033/tags` then `$B url`. The URL is `http://localhost:3033/login?redirect=%2Ftags` and `$B snapshot -i` shows textbox `Email` and button `Send code`.
- **Request code.** Run `$B fill 'input[name=email]' verify-admin@vomatt.test` and `$B click 'button[type=submit]'`. `$B wait 'input[name=code]'` succeeds and the email field is read-only.
- **Sign in.** Run `$B fill 'input[name=code]' "$($C otp verify-admin@vomatt.test)"` and `$B click 'button[type=submit]'`. After `$B wait '[data-slot=sidebar]'` (the console sidebar, which the login page lacks), `$B url` is `http://localhost:3033/tags`, and `$B cookies` lists `accessToken` and `refreshToken`.
- **Already signed in.** Run `$B goto http://localhost:3033/login` then `$B url`. The URL is `http://localhost:3033/`.
- **Sign out.** Run `$B js "document.querySelectorAll('nextjs-portal').forEach(e => e.remove())"` then `$B click 'button:has-text("Sign out")'`. `$B url` is `http://localhost:3033/login` and `$B cookies` has no `accessToken`/`refreshToken`.
- **Non-admin refused.** Signed out, run `$B fill 'input[name=email]' verify-user@vomatt.test` and `$B click 'button[type=submit]'`. `$B wait 'p[role=alert]'` succeeds, the alert reads `This account does not have admin access.`, no code field appears, and `$C otp verify-user@vomatt.test` exits non-zero (no code was issued).
- **Proof.** After each state, `$B screenshot "$E/<step>.png"` and `$B snapshot > "$E/<step>.aria.txt"`, plus `$B cookies > "$E/<step>.cookies.json"` after sign-in and sign-out.

## Gotchas

- The dev-tools badge covers `Sign out`; remove `nextjs-portal` first or the click times out.
- A repeat `Send code` within 180 s fails silently in the UI (no code field). Use `$C otp-reset`.
- `$C otp` must run after `Send code`; the code expires after 180 s.
- `signin-forbidden` shows the app's own English message; other API errors arrive in Chinese.
