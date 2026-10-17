// Shared by the proxy, admin requests, sign-out and the login page

export const LOGIN_PATH = '/login';

/** Why a session ended, shown on the login page. */
export type SessionEndReason = 'expired' | 'security' | 'forbidden';

export function loginPath(reason?: SessionEndReason, redirect?: string) {
	const params = new URLSearchParams();
	if (redirect) params.set('redirect', redirect);
	if (reason) params.set('session_expired', reason);
	const query = params.toString();
	return query ? `${LOGIN_PATH}?${query}` : LOGIN_PATH;
}
