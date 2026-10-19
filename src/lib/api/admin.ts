import 'server-only';

import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import { ActionResult, attempt } from '@/lib/api/action';
import { apiClient, AuthError } from '@/lib/api/client';
import { loginPath } from '@/lib/login';

/**
 * Calls the API as the signed-in admin. When the API ends the session (401,
 * or 403 after the admin role was removed) the user goes back to login.
 */
export async function adminFetch<T>(endpoint: string, init?: { method: string; body?: unknown }): Promise<T> {
	try {
		return await apiClient<T>(endpoint, {
			method: init?.method,
			body: init?.body === undefined ? undefined : JSON.stringify(init.body),
		});
	} catch (error) {
		if (error instanceof AuthError) {
			redirect(loginPath(error.statusCode === 403 ? 'forbidden' : 'expired'));
		}
		throw error;
	}
}

/**
 * Runs an admin mutation from a Server Action. Success refreshes the current
 * page so lists show the change; other API errors come back as an
 * ActionFailure for the form to show.
 */
export async function adminMutation<T>(
	endpoint: string,
	init: { method: string; body?: unknown }
): Promise<ActionResult<T>> {
	// attempt() rethrows adminFetch's login redirect
	const result = await attempt(() => adminFetch<T>(endpoint, init));
	if (result.ok) refresh();
	return result;
}

/** Appends the non-empty `params` to `path` as a query string. */
export function withQuery(path: string, params: Record<string, string | number | undefined>) {
	const query = new URLSearchParams();
	for (const [name, value] of Object.entries(params)) {
		if (value !== undefined && value !== '') query.set(name, String(value));
	}
	const search = query.toString();
	return search ? `${path}?${search}` : path;
}
