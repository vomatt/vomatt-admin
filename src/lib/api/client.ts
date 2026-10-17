// Mirrors vomatt-web src/lib/api/client.ts; change both. Admin differences:
// no locale header (English only), and a 403 is an AuthError like a 401.

import { getTokens } from '@/lib/api/auth';
import { backendFetch } from '@/lib/api/backend-fetch';
import { API_BASE_PATH } from '@/lib/api/constants';

export class AuthError extends Error {
	constructor(
		message: string,
		public statusCode: number = 401
	) {
		super(message);
		this.name = 'AuthError';
	}
}

export class ApiError extends Error {
	constructor(
		message: string,
		public statusCode: number,
		public data?: any,
		/** Seconds to wait before retrying, from a 429's `Retry-After`. */
		public retryAfter?: number
	) {
		super(message);
		this.name = 'ApiError';
	}
}

function readRetryAfter(response: Response) {
	const seconds = Number(response.headers.get('Retry-After'));
	return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined;
}

/**
 * Parse a response from the backend's standard ApiResponse<T> envelope.
 * Uses HTTP status as the authoritative success indicator — the app-level
 * `success` boolean is not reliable across all endpoints.
 */
async function parseApiResponseBody<T>(response: Response): Promise<T> {
	if (!response.ok) {
		let errorMessage = `Request failed with status ${response.status}`;
		let errorData: any;
		try {
			const text = await response.text();
			errorData = text ? JSON.parse(text) : undefined;
			errorMessage = errorData?.message ?? errorData?.errorCode ?? errorMessage;
		} catch {}
		throw new ApiError(errorMessage, response.status, errorData, readRetryAfter(response));
	}

	const contentType = response.headers.get('content-type');
	if (!contentType?.includes('application/json')) {
		return undefined as unknown as T;
	}

	const text = await response.text();
	if (!text) return undefined as unknown as T;

	const body = JSON.parse(text);
	// Unwrap ApiResponse envelope when present; fall back to raw body
	return ('data' in body ? body.data : body) as T;
}

/**
 * Fetch a public (unauthenticated) backend endpoint.
 * Pass a path relative to the API prefix, e.g. `/auth/send-otp`.
 */
export async function publicFetch<T = any>(
	endpoint: string,
	options?: RequestInit
): Promise<T> {
	const response = await backendFetch(
		`${process.env.API_URL}${API_BASE_PATH}${endpoint}`,
		options
	);
	return parseApiResponseBody<T>(response);
}

/**
 * Fetches a backend endpoint as the signed-in admin.
 *
 * Tokens are refreshed only in the proxy (see vomatt-web's copy for why). A
 * 401 means the session is over and a 403 means the account lost its admin
 * role; both throw AuthError so callers send the user back to login.
 */
export async function apiClient<T = any>(
	endpoint: string,
	options: RequestInit = {}
): Promise<T> {
	const { headers: customHeaders, ...fetchOptions } = options;

	const headers = new Headers(customHeaders);
	if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

	const accessToken = (await getTokens())?.accessToken;
	if (!accessToken) throw new AuthError('Not authenticated. Please log in.');
	headers.set('Authorization', `Bearer ${accessToken}`);

	const response = await backendFetch(`${process.env.API_URL}${API_BASE_PATH}${endpoint}`, {
		...fetchOptions,
		headers,
		cache: 'no-store',
	});

	if (response.status === 401 || response.status === 403) {
		throw new AuthError('Your admin session has ended. Please log in again.', response.status);
	}

	return parseApiResponseBody<T>(response);
}
