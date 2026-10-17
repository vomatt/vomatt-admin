// Mirrors vomatt-web src/proxy.tsx (session handling); change both. Admin
// differences: every page but /login needs a session, the session must carry
// the `admin` role, and there is no locale detection.

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ACCESS_TOKEN, REFRESH_TOKEN } from '@/lib/api/constants';
import {
	AccessTokenPayload,
	buildAuthCookies,
	isAdmin,
	isExpiringSoon,
	requestTokenRefresh,
	verifyAccessToken,
} from '@/lib/api/tokens';
import { LOGIN_PATH, loginPath, SessionEndReason } from '@/lib/login';
import { getSafeRedirectPath } from '@/lib/routes';
import { AuthTokens } from '@/types';

type SessionResult =
	| { status: 'valid' }
	| { status: 'refreshed'; tokens: AuthTokens }
	| { status: 'misconfigured'; tokens: AuthTokens }
	| { status: 'none' }
	| { status: 'dead'; suspicious?: true }
	| { status: 'forbidden' };

/**
 * Set when a freshly issued access token still fails verification, i.e.
 * SESSION_SECRET doesn't match the API's JWT_SECRET. Holds the refresh token
 * it was learned with, so that pair isn't rotated again on every request.
 */
const KEY_MISMATCH = 'auth-key-mismatch';

/**
 * Same steps as vomatt-web: a valid access token passes, a missing or nearly
 * expired one gets one refresh attempt, a refused refresh token is dead.
 * On top, a token without the `admin` role ends the session.
 */
async function resolveSession(request: NextRequest): Promise<SessionResult> {
	const accessToken = request.cookies.get(ACCESS_TOKEN)?.value;
	const refreshToken = request.cookies.get(REFRESH_TOKEN)?.value;

	const payload = accessToken ? await verifyAccessToken(accessToken) : null;
	if (payload && (!refreshToken || !isExpiringSoon(payload))) return checkRole(payload);
	if (!refreshToken) return { status: 'none' };
	// Already known not to verify; refreshing again would only rotate in a loop
	if (request.cookies.get(KEY_MISMATCH)?.value === refreshToken) return { status: 'none' };

	const result = await requestTokenRefresh(refreshToken);
	if (result.status === 'ok') {
		const fresh = await verifyAccessToken(result.tokens.accessToken);
		if (!fresh) {
			console.error('Access token failed verification: check SESSION_SECRET matches the API JWT_SECRET');
			return { status: 'misconfigured', tokens: result.tokens };
		}
		return isAdmin(fresh) ? { status: 'refreshed', tokens: result.tokens } : { status: 'forbidden' };
	}
	// Keep a still-valid access token for its last seconds rather than signing out early
	if (payload) return checkRole(payload);
	if (result.status === 'unavailable') return { status: 'none' };
	return result.suspicious ? { status: 'dead', suspicious: true } : { status: 'dead' };
}

function checkRole(payload: AccessTokenPayload): SessionResult {
	return isAdmin(payload) ? { status: 'valid' } : { status: 'forbidden' };
}

export async function proxy(request: NextRequest) {
	const { pathname, searchParams } = request.nextUrl;
	const isLoginPath = pathname === LOGIN_PATH;

	const session = await resolveSession(request);
	const hasValidSession = session.status === 'valid' || session.status === 'refreshed';
	const clearsSession = session.status === 'dead' || session.status === 'forbidden';

	// Server Components and Server Actions read cookies from the request, so
	// rotated tokens must be written there too, not only to the browser.
	// A misconfigured rotation is still saved: the old refresh token is spent.
	const authCookies =
		session.status === 'refreshed' || session.status === 'misconfigured'
			? buildAuthCookies(session.tokens)
			: [];
	if (clearsSession) {
		request.cookies.delete(ACCESS_TOKEN);
		request.cookies.delete(REFRESH_TOKEN);
	}
	for (const { name, value } of authCookies) request.cookies.set(name, value);

	const applyAuthCookies = (res: NextResponse) => {
		for (const { name, value, options } of authCookies) res.cookies.set(name, value, options);
		if (clearsSession) {
			res.cookies.delete(ACCESS_TOKEN);
			res.cookies.delete(REFRESH_TOKEN);
		}
		if (session.status === 'misconfigured') {
			res.cookies.set(KEY_MISMATCH, session.tokens.refreshToken, { httpOnly: true, path: '/' });
		}
		return res;
	};

	// Signed-in admins skip the login page, unless the API rejected their session
	if (hasValidSession && isLoginPath && !searchParams.has('session_expired')) {
		const target = getSafeRedirectPath(searchParams.get('redirect'));
		return applyAuthCookies(NextResponse.redirect(new URL(target, request.url)));
	}

	if (!hasValidSession && !isLoginPath) {
		const target = loginPath(endReason(session), `${pathname}${request.nextUrl.search}`);
		return applyAuthCookies(NextResponse.redirect(new URL(target, request.url)));
	}

	// Forward the request headers only when the cookies in them changed
	const changedCookies = authCookies.length > 0 || clearsSession;
	return applyAuthCookies(
		changedCookies ? NextResponse.next({ request: { headers: request.headers } }) : NextResponse.next()
	);
}

function endReason(session: SessionResult): SessionEndReason | undefined {
	if (session.status === 'forbidden') return 'forbidden';
	if (session.status === 'dead') return session.suspicious ? 'security' : 'expired';
	return undefined;
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
