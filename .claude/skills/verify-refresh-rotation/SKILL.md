---
name: verify-refresh-rotation
description: Exhaustively checks that the admin proxy's refresh-token rotation (src/proxy.ts, src/lib/api/tokens.ts) never makes vomatt-api's reuse detector end a signed-in admin's session, across every ordering of concurrent requests, proxy instances and API replies up to a bound. Use when a change touches the proxy, token refresh, auth cookies, or the API's refresh/grace behavior.
---

# Verify refresh-token rotation

## The property

**Promise:** an admin who keeps using the console is never signed out by vomatt-api's refresh-token reuse detector, however the browser's concurrent requests, the proxy instances and the API's replies interleave.

**Harm if broken:** the API treats a spent refresh token that comes back after its 10 s grace window as stolen and ends that sign-in, so the admin is thrown to `/login?session_expired=security` ("You were signed out for security") during ordinary use. vomatt-web runs the same code (`Mirrors vomatt-web …`), so a break there hits public users too.

## How it is checked

No verifier runs on async TypeScript interleavings, so the check runs the **real** `proxy()` and `requestTokenRefresh()` code and enumerates every schedule up to a bound (stateless model checking, depth-first with replay). Each step is one of:

- the browser sends `GET /tags` with its current cookies to proxy instance 0 or 1 (separate module copies, so separate in-flight maps, like separate serverless instances);
- the API answers one pending `POST /api/auth/refresh`;
- a finished response reaches the browser, which stores its `Set-Cookie`s (any order);
- in the lost-response scope only: a finished response is lost before the browser stores its cookies;
- time passes, only while nothing is in flight: 11 s (past the grace window) or 841 s (into the 60 s refresh leeway of a 900 s access token).

The API side is a stand-in for `RefreshTokenService.rotate` in `../vomatt-api/src/main/java/com/vomatt/common/security/RefreshTokenService.java`: grace-cache hit returns the same pair, a live token rotates and is marked consumed, a consumed token past grace revokes the session and answers `auth.suspicious_login`, anything else `auth.refresh_token.invalid`.

A run fails when the API sees a spent token past grace, or when any response redirects the signed-in admin to `/login`.

**Bounds:** 2 proxy instances, 3 browser requests, 2 waits. **Assumptions:** one browser and one sign-in; every request finishes within the grace window (time never passes while one is in flight); `jose` is replaced by a stand-in that checks expiry exactly and accepts every signature (signatures, `SESSION_SECRET` mismatch and the `auth-key-mismatch` path are out of scope); the API never fails (no 5xx/429). **Not covered:** server components and actions (they never refresh), sign-in and sign-out, more than one tab's worth of cookie jars, and the real network.

## Run it

```bash
npx jest --testMatch '**/verification/*.check.ts'
```

About 10 s. The check lives in `src/__tests__/verification/refresh-rotation.check.ts` and is not part of `npm test` (its file ends in `.check.ts`). It prints the states explored and, on failure, a counterexample as numbered browser/API steps.

**Expected result at the sync commit:**

- `an admin whose responses all reach the browser …` passes (about 17,000 states).
- `an admin whose response is lost after the proxy rotated …` **fails. This is a known finding, not a regression.** The counterexample: the access token is in its last minute; the proxy rotates `r0` → `r1` for a request; that response never reaches the browser (navigation cancelled, tab closed, connection dropped before the headers); more than 10 s pass; the next request sends `r0` again and the API ends the session. The proxy can't prevent this on its own: the new pair only reaches the browser through that response. It stays failing until someone changes the design (e.g. the API's grace handling). Don't weaken the check to make it pass.

## Does my change touch the verified code?

Covered code (re-check on any change to these):

- `src/proxy.ts`: `resolveSession`, `checkRole`, `proxy` (cookie writes, `KEY_MISMATCH`, redirects), `endReason`.
- `src/lib/api/tokens.ts`: `verifyAccessToken`, `isAdmin`, `isExpiringSoon`, `requestTokenRefresh`, `fetchRefreshedTokens`, `readAuthTokens`, `buildAuthCookies`.
- `src/lib/api/constants.ts`: `ACCESS_TOKEN_EXPIRY`, `ACCESS_TOKEN_REFRESH_LEEWAY`, cookie names.
- `src/lib/api/backend-fetch.ts`: `backendFetch` (only as the path to `fetch`).
- The API's `RefreshTokenService.rotate` and `jwt.refresh-grace-seconds` (default 10), mirrored by `class Api` and `GRACE_SECONDS` in the check.

**Sync commit: `6a78d62`** — the commit at which the check was last confirmed to describe the covered code. To see whether it may be stale:

```bash
git diff 6a78d62 -- src/proxy.ts src/lib/api/tokens.ts src/lib/api/constants.ts src/lib/api/backend-fetch.ts
git -C ../vomatt-api log --oneline -1 -- src/main/java/com/vomatt/common/security/RefreshTokenService.java
```

(In a worktree, `../vomatt-api` is next to the main checkout.) Move the sync commit forward, in this file, only after you have read the diff and confirmed the check still models the code at the new commit.

## Reading a failure

1. **The delivered-responses test fails:** a real regression unless the model is wrong. Replay the counterexample against the code: each `request N` line is one `proxy()` call, each `API answers` line one `rotate` call. If every step is something the real browser, proxy and API can do, it is a bug: report it with the steps, and don't change product code unless asked.
2. **Modeling error signs:** the counterexample needs something the system can't do (time passing mid-request, the API answering a token the proxy never sent, cookies applied out of a response that was never delivered), or the API stand-in no longer matches `RefreshTokenService.rotate`. Fix the check, not the product, and say what you changed.
3. **The lost-response test passes:** something changed the known finding. Find out what before you celebrate; a pass from a harness bug looks the same.
4. **Fewer states than expected, or seconds instead of ~10 s:** the harness may have stopped reaching refreshes (e.g. `Date.now` not pinned to the model clock, so nothing ever looks expiring). Check that a counterexample log shows `API answers` lines.

## Updating the check after an intended change

- The proxy's decisions are exercised for real; only the jose, `fetch` and clock boundaries are stand-ins. Keep it that way: drive new proxy behavior through `World.apply`, don't reimplement it.
- If the API's rotation rules change, update `class Api` from `RefreshTokenService.rotate` and quote the method you mirrored in the commit message.
- If you change `BOUNDS`, note the new state counts and runtime here.
- Prove the check still fails on a break: in `src/proxy.ts` `applyAuthCookies`, comment out the line `for (const { name, value, options } of authCookies) res.cookies.set(name, value, options);`. The delivered-responses test must fail with a reuse counterexample. Restore the line and confirm the baseline above.
