'use server';

// Mirrors vomatt-web src/lib/api/services/auth.ts; change both. Admin
// differences: sign-in uses the admin console endpoints (only their tokens
// carry the admin scope, so passkey sign-in verifies at the admin endpoint
// while sharing the options one), there is no check-email step or passkey
// registration (no signup here), and errors are English messages.

import { redirect } from 'next/navigation';

import { clearAuthTokens, getTokens, setAuthTokens } from '@/lib/api/auth';
import { toAuthErrorMessage } from '@/lib/api/auth-errors';
import { ApiError, publicFetch } from '@/lib/api/client';
import { readAuthTokens } from '@/lib/api/tokens';
import { LOGIN_PATH } from '@/lib/login';

type AuthFailure = { ok: false; message: string };
export type AuthResult = { ok: true } | AuthFailure;
// What `credential.toJSON()` returns. The build checks with the pinned TypeScript 5,
// `npx tsc` with Sanity CLI's TypeScript 6, and the DOM lib names this type differently in each
export type PasskeyCredentialJSON = ReturnType<PublicKeyCredential['toJSON']>;

function toFailure(error: unknown): AuthFailure {
	if (error instanceof ApiError) {
		return { ok: false, message: toAuthErrorMessage(error.data?.errorCode, error.statusCode) };
	}
	return { ok: false, message: toAuthErrorMessage(undefined) };
}

function postJson(endpoint: string, body: unknown) {
	return publicFetch(endpoint, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
		cache: 'no-store',
	});
}

/** Emails a one-time code; the API refuses accounts without the admin role. */
export async function requestOtp(email: string): Promise<AuthResult> {
	try {
		await postJson('/auth/admin/send-otp', { email: email.trim().toLowerCase() });
		return { ok: true };
	} catch (error) {
		return toFailure(error);
	}
}

/** Verifies the code and starts the session. */
export async function verifyOtp(email: string, code: string): Promise<AuthResult> {
	try {
		const data = await postJson('/auth/admin/verify-otp', {
			email: email.trim().toLowerCase(),
			code: code.trim(),
		});
		const tokens = readAuthTokens(data);
		if (!tokens) return toFailure(null);
		await setAuthTokens(tokens);
		return { ok: true };
	} catch (error) {
		return toFailure(error);
	}
}

/**
 * Request options for signing in with any passkey on the device (no email
 * needed); pass them to `PublicKeyCredential.parseRequestOptionsFromJSON`.
 * Each call issues a challenge that lasts 5 minutes and is spent by one verify call.
 */
export async function getPasskeyLoginOptions(): Promise<
	{ ok: true; options: PublicKeyCredentialRequestOptionsJSON } | AuthFailure
> {
	try {
		const options = await postJson('/auth/passkey/login/options', undefined);
		return { ok: true, options };
	} catch (error) {
		return toFailure(error);
	}
}

/** Starts the session from the signed-in passkey's `credential.toJSON()`, like `verifyOtp`. */
export async function verifyPasskeyLogin(credential: PasskeyCredentialJSON): Promise<AuthResult> {
	try {
		const tokens = readAuthTokens(await postJson('/auth/admin/passkey/login/verify', { credential }));
		if (!tokens) return toFailure(null);
		await setAuthTokens(tokens);
		return { ok: true };
	} catch (error) {
		return toFailure(error);
	}
}

/**
 * Revokes the refresh token on the backend, then clears the cookies. The
 * cookies are cleared even when the backend can't be reached.
 */
export async function signout() {
	const refreshToken = (await getTokens())?.refreshToken;
	if (refreshToken) {
		await postJson('/auth/logout', { refreshToken }).catch((error) => {
			console.error('Logout request failed:', error);
		});
	}
	await clearAuthTokens();
	redirect(LOGIN_PATH);
}
